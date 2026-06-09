package main

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
	"time"
)

type LeaderboardEntry struct {
	Name   string `json:"name"`
	Points int    `json:"points"`
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

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(entries); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

type MatchEntry struct {
	ID        int       `json:"id"`
	Date      time.Time `json:"date"`
	Round     string    `json:"round"`
	HomeTeam  string    `json:"home_team"`
	HomeScore *int      `json:"home_score,omitempty"`
	AwayTeam  string    `json:"away_team"`
	AwayScore *int      `json:"away_score,omitempty"`
	Complete  bool      `json:"complete"`
}

func matchesHandler(matchLookup map[int]*Match) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		now := time.Now()

		entries := make([]*MatchEntry, 0, len(matchLookup))

		for _, m := range matchLookup {
			entry := convertMatchToEntry(m, now)
			entries = append(entries, entry)
		}
		sort.Slice(entries, func(i, j int) bool {
			return entries[i].Date.Before(entries[j].Date)
		})

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(entries); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func convertMatchToEntry(match *Match, now time.Time) *MatchEntry {
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

	return &MatchEntry{
		ID:        match.ID,
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

		if err := json.NewEncoder(w).Encode(entry); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func participantHandler(participantsLookup map[string]*Participant) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		part, ok := participantsLookup[id]
		if !ok {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(part); err != nil {
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

		if err := json.NewEncoder(w).Encode(tournamentPredictions); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}
