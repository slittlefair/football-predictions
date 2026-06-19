package main

import (
	"encoding/json"
	"fmt"
	"footballpredictions/api/gen"
	"log"
	"net/http"
	"os"
	"slices"
	"sort"
	"strconv"
	"time"

	"github.com/gocarina/gocsv"
)

func (t Tournament) matchLookup() map[int]*Match {
	matchLookup := map[int]*Match{}
	for _, m := range t.Matches {
		matchLookup[m.ID] = m
	}
	return matchLookup
}

type PointsTallier struct {
	Name           string
	Points         int
	CorrectScores  int
	CorrectResults int
	JokersPlayed   int
}

func sortPointsTallier(a, b *PointsTallier) int {
	if a.Points == b.Points {
		if a.CorrectScores == b.CorrectScores {
			if a.Name < b.Name {
				return -1
			}
			return 1
		}
		return b.CorrectScores - a.CorrectScores
	}
	return b.Points - a.Points
}

func (t *Tournament) leaderboardHandler() http.HandlerFunc {
	return func(
		w http.ResponseWriter,
		r *http.Request,
	) {
		now := time.Now()
		startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		currentPoints := make([]*PointsTallier, 0, len(t.Participants))
		previousPoints := make([]*PointsTallier, 0, len(t.Participants))
		played := map[int]struct{}{}

		matchLookup := t.matchLookup()

		for _, p := range t.Participants {
			curr := &PointsTallier{Name: p.Name}
			prev := &PointsTallier{Name: p.Name}
			for _, pred := range p.Predictions {
				match, ok := matchLookup[pred.ID]
				if !ok {
					http.NotFound(w, r)
					return
				}

				if match.HomeScore != nil && match.AwayScore != nil {
					played[match.ID] = struct{}{}
				}

				if pred.Joker {
					curr.JokersPlayed++
				}

				score, wasCorrect := pred.scoreMatch(match)
				curr.Points += score
				if wasCorrect {
					curr.CorrectScores++
				} else if score != 0 {
					curr.CorrectResults++
				}
				if !match.Date.Before(startOfToday) {
					continue
				}

				prev.Points += score
				if wasCorrect {
					prev.CorrectScores++
				}
			}
			currentPoints = append(currentPoints, curr)
			previousPoints = append(previousPoints, prev)
		}

		slices.SortStableFunc(currentPoints, sortPointsTallier)
		slices.SortStableFunc(previousPoints, sortPointsTallier)

		leaderboard := []gen.Leaderboard{}

		for i, v := range currentPoints {
			previousPosition := slices.IndexFunc(
				previousPoints,
				func(p *PointsTallier) bool { return p.Name == v.Name },
			)
			leaderboard = append(leaderboard, gen.Leaderboard{
				Participant:      v.Name,
				CorrectScores:    v.CorrectScores,
				CorrectResults:   v.CorrectResults,
				Position:         i + 1,
				TotalPoints:      v.Points,
				PreviousPosition: previousPosition + 1,
				Played:           len(played),
				JokersPlayed:     v.JokersPlayed,
				PointsDifference: v.Points - previousPoints[previousPosition].Points,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(leaderboard); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (t Tournament) matchesHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		entries := make([]gen.Match, 0, len(t.Matches))

		for _, m := range t.Matches {
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
	if slices.Contains([]string{"1", "2", "3"}, match.Round) && match.Group != "" {
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
		HasResult: match.HomeScore != nil && match.AwayScore != nil,
	}
}

func (t Tournament) matchHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "couldn't convert match id", http.StatusBadRequest)
			return
		}

		matchIdx := slices.IndexFunc(t.Matches, func(m *Match) bool { return m.ID == id })
		if matchIdx == -1 {
			http.NotFound(w, r)
			return
		}

		match := t.Matches[matchIdx]

		entry := convertMatchToEntry(match)

		matchPredictions := gen.MatchPredictions{
			Id:    match.ID,
			Match: entry,
		}

		if matchIdx != 0 {
			prevMatch := t.Matches[matchIdx-1]
			matchPredictions.PreviousNav = &gen.MatchNavigation{
				Id:       prevMatch.ID,
				HomeTeam: prevMatch.Home,
				AwayTeam: prevMatch.Away,
			}
		}

		if matchIdx != len(t.Matches)-1 {
			nextMatch := t.Matches[matchIdx+1]
			matchPredictions.NextNav = &gen.MatchNavigation{
				Id:       nextMatch.ID,
				HomeTeam: nextMatch.Home,
				AwayTeam: nextMatch.Away,
			}
		}

		for _, p := range t.Participants {
			for _, pred := range p.Predictions {
				if pred.ID == match.ID {
					matchPredictions.Predictions = append(
						matchPredictions.Predictions,
						t.mapPrediction(pred),
					)
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

func (t Tournament) participantHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")

		pIdx := slices.IndexFunc(t.Participants, func(m *Participant) bool { return m.Name == name })
		if pIdx == -1 {
			http.NotFound(w, r)
			return
		}
		participant := t.Participants[pIdx]

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(t.mapParticipant(participant)); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (t Tournament) mapPrediction(p *Prediction) gen.Prediction {
	m := t.findMatch(p.ID)
	points, _ := p.scoreMatch(m)
	return gen.Prediction{
		Id:          p.ID,
		HomeScore:   p.HomeScore,
		AwayScore:   p.AwayScore,
		UsedJoker:   &p.Joker,
		Points:      points,
		HasResult:   m.HomeScore != nil && m.AwayScore != nil,
		Participant: p.Participant,
	}
}

func (t Tournament) mapParticipant(p *Participant) gen.Participant {
	predictions := make([]gen.Prediction, 0, len(p.Predictions))

	for _, pr := range p.Predictions {
		predictions = append(predictions, t.mapPrediction(pr))
	}

	sort.Slice(predictions, func(i, j int) bool {
		return predictions[i].Id < predictions[j].Id
	})

	return gen.Participant{
		Name:        p.Name,
		Predictions: predictions,
		TotalPoints: p.TotalPoints,
		TournamentPredictions: gen.TournamentPredictions{
			Winner:            p.CompPrediction.Winner,
			RunnerUp:          p.CompPrediction.RunnerUp,
			ThirdPlace:        p.CompPrediction.ThirdPlace,
			FourthPlace:       p.CompPrediction.FourthPlace,
			TopScorer:         p.CompPrediction.TopScorer,
			ScorerNationality: p.CompPrediction.ScorerNationality,
		},
	}
}

func (t Tournament) participantsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		participants := make([]gen.Participant, 0, len(t.Participants))
		for _, v := range t.Participants {
			participants = append(participants, t.mapParticipant(v))
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

func (t Tournament) tournamentHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		tournamentPredictions := map[string]*TournamentPrediction{}

		for _, v := range t.Participants {
			tournamentPredictions[v.Name] = v.CompPrediction
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(tournamentPredictions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func teamsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		resIn, err := os.Open("data/countries.csv")
		if err != nil {
			panic(err)
		}
		defer func() { _ = resIn.Close() }()

		teams := []*gen.Team{}

		if err := gocsv.UnmarshalFile(resIn, &teams); err != nil {
			panic(err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		if err := json.NewEncoder(w).Encode(teams); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (t *Tournament) predictionsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			t.getPredictions(w, r)
		case http.MethodPost:
			t.createPredictionHandler(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func (t *Tournament) getPredictions(w http.ResponseWriter, r *http.Request) {
	params, err := parseGetPredictionsParams(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	predictions := t.filterPredictions(params)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if err := json.NewEncoder(w).Encode(predictions); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (t *Tournament) createPredictionHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("HERE")
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var prediction gen.ParticipantPrediction

	if err := json.NewDecoder(r.Body).Decode(&prediction); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	fmt.Printf("request: %+#v\n", prediction)

	for _, p := range t.Participants {
		fmt.Println(p.Name, prediction.Participant, p.Name == prediction.Participant)
		if p.Name == prediction.Participant {
			for _, pred := range p.Predictions {
				if pred.ID == prediction.MatchId {
					fmt.Println("Error needs to show")
					http.Error(w, "prediction for match already exists", http.StatusConflict)
					return
				}
			}
			joker := false
			if prediction.PlayedJoker != nil {
				joker = *prediction.PlayedJoker
			}
			fmt.Println(len(p.Predictions))
			p.Predictions = append(p.Predictions, &Prediction{
				ID:        prediction.MatchId,
				HomeScore: prediction.HomeScore,
				AwayScore: prediction.AwayScore,
				Joker:     joker,
			})
			fmt.Println(len(p.Predictions))
		}
	}

	// TODO savePrediction

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(prediction); err != nil {
		log.Printf("failed to write response: %v", err)
	}
}

func parseGetPredictionsParams(r *http.Request) (*gen.GetPredictionsParams, error) {
	q := r.URL.Query()
	params := &gen.GetPredictionsParams{}

	if v := q.Get("matchId"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil {
			return params, err
		}
		params.MatchId = &id
	}

	if v := q.Get("participant"); v != "" {
		params.Participant = &v
	}

	return params, nil
}

func (t *Tournament) findMatch(id int) *Match {
	for _, m := range t.Matches {
		if m.ID == id {
			return m
		}
	}
	return nil
}

func (t *Tournament) filterPredictions(params *gen.GetPredictionsParams) []gen.Prediction {
	predictions := []gen.Prediction{}
	if params == nil {
		for _, p := range t.Predictions {
			predictions = append(predictions, t.mapPrediction(p))
		}
		return predictions
	}

	for _, p := range t.Predictions {
		if params.MatchId != nil {
			if *params.MatchId == p.ID {
				predictions = append(predictions, t.mapPrediction(p))
				continue
			}
		}
		if params.Participant != nil {
			if *params.Participant == p.Participant {
				predictions = append(predictions, t.mapPrediction(p))
			}
		}
	}
	return predictions
}
