package main

import (
	"encoding/json"
	"fmt"
	"footballpredictions/api/gen"
	"net/http"
	"sort"
	"strconv"
	"time"
)

type LeaderboardEntry struct {
	Name             string `json:"name"`
	Points           int    `json:"points"`
	PreviousPosition int    `json:"previous_position"`
}

func leaderboardHandler(participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(
		w http.ResponseWriter,
		_ *http.Request,
	) {
		entries := make([]LeaderboardEntry, 0, len(participantsLookup))

		for _, p := range participantsLookup {
			entries = append(entries, LeaderboardEntry{
				Name:   p.Name,
				Points: p.TotalPoints,
			})
		}

		sort.Slice(entries, func(i, j int) bool {
			if entries[i].Points == entries[j].Points {
				return entries[i].Name < entries[j].Name
			}
			return entries[i].Points > entries[j].Points
		})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(entries); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func matchesHandler(matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		now := time.Now()

		entries := make([]*gen.MatchEntry, 0, len(matchLookup))

		for _, m := range matchLookup {
			entry := convertMatchToEntry(m, now)
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

func convertMatchToEntry(match *Match, now time.Time) *gen.MatchEntry {
	complete := now.After(match.Date.Add(time.Hour * 2))
	homeScore := match.HomeScore
	awayScore := match.AwayScore
	if !complete {
		homeScore = nil
		awayScore = nil
	}

	round := match.Round
	if match.Round == "1" && match.Group != "" {
		round = match.Group
	}

	return &gen.MatchEntry{
		Id:        match.ID,
		Date:      match.Date,
		Round:     round,
		HomeTeam:  match.Home,
		HomeScore: homeScore,
		AwayTeam:  match.Away,
		AwayScore: awayScore,
		Complete:  complete,
	}
}

func matchHandler(matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		now := time.Now()
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

		entry := convertMatchToEntry(match, now)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(entry); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func participantHandler(participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("name")

		part, ok := participantsLookup[id]
		if !ok {
			http.NotFound(w, r)
			return
		}

		fmt.Println(id)
		fmt.Printf("%v\n", part)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(mapParticipant(part)); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func mapPrediction(p *Prediction) gen.Prediction {
	return gen.Prediction{
		Id:        p.ID,
		HomeScore: p.HomeScore,
		AwayScore: p.AwayScore,
		UsedJoker: &p.Joker,
	}
}

func mapParticipant(p *Participant) gen.Participant {
	predictions := make([]gen.Prediction, 0, len(p.Predictions))
	for _, p := range p.Predictions {
		predictions = append(predictions, mapPrediction(p))
	}

	return gen.Participant{
		Name:        p.Name,
		Predictions: predictions,
		TotalPoints: p.TotalPoints,
	}
}

func participantsHandler(participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		participants := make([]gen.Participant, 0, len(participantsLookup))
		for _, v := range participantsLookup {
			participants = append(participants, mapParticipant(v))
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
