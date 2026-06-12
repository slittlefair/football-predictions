package main

import (
	"encoding/json"
	"footballpredictions/api/gen"
	"net/http"
	"sort"
	"strconv"
	"time"
)

type LeaderboardEntry struct {
	Name           string `json:"name"`
	Points         int    `json:"points"`
	PreviousPoints int
	CorrectScores  int
}

func leaderboardHandler(participantsLookup map[string]*Participant, matchLookup map[int]*Match) http.HandlerFunc {
	return func(
		w http.ResponseWriter,
		r *http.Request,
	) {
		now := time.Now()
		startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		entries := make([]LeaderboardEntry, 0, len(participantsLookup))

		for _, p := range participantsLookup {
			entry := LeaderboardEntry{Name: p.Name}
			for _, pred := range p.Predictions {
				match, ok := matchLookup[pred.ID]
				if !ok {
					http.NotFound(w, r)
					return
				}

				score, wasCorrect := pred.scoreMatch(match)
				entry.Points += score
				if !match.Date.Before(startOfToday) {
					continue
				}
				entry.PreviousPoints += score
				if wasCorrect {
					entry.CorrectScores++
				}
			}
			entries = append(entries, entry)
		}

		sort.Slice(entries, func(i, j int) bool {
			if entries[i].PreviousPoints == entries[j].PreviousPoints {
				if entries[i].CorrectScores == entries[j].CorrectScores {
					return entries[i].Name < entries[j].Name
				}
				return entries[i].CorrectScores == entries[j].CorrectScores
			}
			return entries[i].Points > entries[j].Points
		})

		prevPositions := map[string]int{}
		for i, v := range entries {
			prevPositions[v.Name] = i + 1
		}

		sort.Slice(entries, func(i, j int) bool {
			if entries[i].Points == entries[j].Points {
				return entries[i].Name < entries[j].Name
			}
			return entries[i].Points > entries[j].Points
		})

		leaderboard := []gen.Leaderboard{}

		for i, v := range entries {
			leaderboard = append(leaderboard, gen.Leaderboard{
				Participant:      v.Name,
				CorrectScores:    v.CorrectScores,
				Position:         i + 1,
				TotalPoints:      v.Points,
				PreviousPosition: prevPositions[v.Name],
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(leaderboard); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func matchesHandler(matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		entries := make([]gen.Match, 0, len(matchLookup))

		for _, m := range matchLookup {
			entry := convertMatchToEntry(m)
			entries = append(entries, entry)
		}
		sort.Slice(entries, func(i, j int) bool {
			return entries[i].Date.Before(entries[j].Date)
		})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(entries); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func convertMatchToEntry(match *Match) gen.Match {
	homeScore := match.HomeScore
	awayScore := match.AwayScore

	round := match.Round
	if match.Round == "1" && match.Group != "" {
		round = match.Group
	}

	return gen.Match{
		Id:        match.ID,
		Date:      match.Date,
		Round:     round,
		HomeTeam:  match.Home,
		HomeScore: homeScore,
		AwayTeam:  match.Away,
		AwayScore: awayScore,
	}
}

func matchHandler(matchLookup map[int]*Match, participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "couldn't convert match id", http.StatusBadRequest)
			return
		}

		match, ok := matchLookup[id]
		if !ok {
			http.NotFound(w, r)
			return
		}

		entry := convertMatchToEntry(match)

		matchPredictions := gen.MatchPredictions{
			Id:    match.ID,
			Match: entry,
		}

		for _, p := range participantsLookup {
			for _, pred := range p.Predictions {
				if pred.ID == match.ID {
					points, _ := pred.scoreMatch(match)
					matchPredictions.Predictions = append(matchPredictions.Predictions, gen.Prediction{
						HomeScore:   pred.HomeScore,
						AwayScore:   pred.AwayScore,
						UsedJoker:   &pred.Joker,
						Participant: p.Name,
						Points:      points,
					})
					break
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(matchPredictions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func participantHandler(participantsLookup map[string]*Participant, matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("name")

		part, ok := participantsLookup[id]
		if !ok {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(mapParticipant(part, matchLookup)); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func mapPrediction(p *Prediction, m *Match) gen.Prediction {
	points, _ := p.scoreMatch(m)
	return gen.Prediction{
		Id:        p.ID,
		HomeScore: p.HomeScore,
		AwayScore: p.AwayScore,
		UsedJoker: &p.Joker,
		Points:    points,
	}
}

func mapParticipant(p *Participant, matchLookup map[int]*Match) gen.Participant {
	predictions := make([]gen.Prediction, 0, len(p.Predictions))
	for _, p := range p.Predictions {
		m, ok := matchLookup[p.ID]
		if !ok {
			continue
		}
		predictions = append(predictions, mapPrediction(p, m))
	}

	sort.Slice(predictions, func(i, j int) bool {
		return predictions[i].Id < predictions[j].Id
	})

	return gen.Participant{
		Name:        p.Name,
		Predictions: predictions,
		TotalPoints: p.TotalPoints,
		TournamentPredictions: gen.TournamentPredictions{
			Winner:      p.CompPrediction.Winner,
			RunnerUp:    p.CompPrediction.RunnerUp,
			ThirdPlace:  p.CompPrediction.ThirdPlace,
			FourthPlace: p.CompPrediction.FourthPlace,
			TopScorer:   p.CompPrediction.TopScorer,
		},
	}
}

func participantsHandler(participantsLookup map[string]*Participant, matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		participants := make([]gen.Participant, 0, len(participantsLookup))
		for _, v := range participantsLookup {
			participants = append(participants, mapParticipant(v, matchLookup))
		}

		sort.Slice(participants, func(i, j int) bool {
			return participants[i].Name < participants[j].Name
		})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(participants); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func tournamentHandler(participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		tournamentPredictions := map[string]*CompPrediction{}

		for k, v := range participantsLookup {
			tournamentPredictions[k] = v.CompPrediction
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(tournamentPredictions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
