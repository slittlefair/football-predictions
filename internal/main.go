// Package main calculates prediction scores and serves leaderboard data
// for the World Cup family prediction league.
package main

import (
	"fmt"
	"net/http"
	"os"
	"slices"
	"time"

	"github.com/gocarina/gocsv"
)

type Tournament struct {
	Matches      []*Match
	Participants []*Participant
	Placements   *CompPlacements
	Completed    bool
}

type Match struct {
	ID        int       `csv:"Match Number"`
	Round     string    `csv:"Round Number"`
	Date      time.Time `csv:"Date"`
	Home      string    `csv:"Home"`
	Away      string    `csv:"Away"`
	HomeScore *int      `csv:"Home Score,omitempty"`
	AwayScore *int      `csv:"Away Score,omitempty"`
	Group     string    `csv:"Group"`
}

type Prediction struct {
	ID        int  `csv:"Match Number"`
	HomeScore *int `csv:"Home Score"`
	AwayScore *int `csv:"Away Score"`
	Points    int
	Joker     bool `csv:"Joker"`
}

type CompPlacements struct {
	Winner      string `csv:"Winner"`
	RunnerUp    string `csv:"Runner Up"`
	ThirdPlace  string `csv:"Third Place"`
	FourthPlace string `csv:"Fourth Place"`
	TopScorer   string `csv:"Top Scorer"`
}

type CompPrediction struct {
	Participant string `csv:"Participant"`
	CompPlacements
}

type Participant struct {
	Name           string
	Preds          []*Prediction
	Predictions    map[int]*Prediction
	CompPrediction *CompPrediction
	TotalPoints    int
}

const correctScore = 3
const correctResult = 1

const correctPlacement = 5
const incorrectPlacement = 2

func loadMatches() map[int]*Match {
	resIn, err := os.Open("data/score_results.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = resIn.Close() }()

	matches := []*Match{}

	if err := gocsv.UnmarshalFile(resIn, &matches); err != nil {
		panic(err)
	}

	matchLookup := make(map[int]*Match, len(matches))
	for _, v := range matches {
		matchLookup[v.ID] = v
	}

	return matchLookup
}

func main() {
	now := time.Now()

	tournament := &Tournament{}

	matchLookup := loadMatches()

	compPredictions := []*CompPrediction{}

	tournyIn, err := os.Open("data/predictions/Tournament.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = tournyIn.Close() }()

	if err := gocsv.UnmarshalFile(tournyIn, &compPredictions); err != nil {
		panic(err)
	}

	participantsLookup := make(map[string]*Participant)

	for _, cp := range compPredictions {
		partIn, err := os.Open(fmt.Sprintf("data/predictions/%s.csv", cp.Participant))
		if err != nil {
			panic(err)
		}
		defer func() { _ = partIn.Close() }()

		part := &Participant{Name: cp.Participant, Predictions: map[int]*Prediction{}, CompPrediction: cp}
		predictions := []*Prediction{}
		if err := gocsv.UnmarshalFile(partIn, &predictions); err != nil {
			panic(fmt.Errorf("loading %s: %w", cp.Participant, err))
		}
		for _, p := range predictions {
			part.Predictions[p.ID] = p
			match, ok := matchLookup[p.ID]
			if !ok {
				panic(fmt.Errorf("match not found: %v", p.ID))
			}
			score := p.scoreMatch(match, now)
			if p.Joker {
				score *= 2
			}
			p.Points = score
			part.TotalPoints += score
		}

		participantsLookup[part.Name] = part
	}

	completed := true
	for _, m := range matchLookup {
		tournament.Matches = append(tournament.Matches, m)
		if completed && now.Before(m.Date.Add(time.Hour*2)) {
			completed = false
		}
	}
	tournament.Completed = completed
	for _, p := range participantsLookup {
		tournament.Participants = append(tournament.Participants, p)
	}

	tournament.scoreTournament()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/leaderboard", leaderboardHandler(participantsLookup))
	mux.HandleFunc("/api/matches", matchesHandler(matchLookup))
	mux.HandleFunc("/api/matches/{id}", matchHandler(matchLookup))
	mux.HandleFunc("/api/participants", participantsHandler(participantsLookup))
	mux.HandleFunc("/api/participants/{id}", participantHandler(participantsLookup))
	mux.HandleFunc("/api/tournament", tournamentHandler(participantsLookup))

	fmt.Println("Listening on http://localhost:8080")

	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		panic(err)
	}
}

func (p *Prediction) scoreMatch(m *Match, now time.Time) int {
	if !m.isValidMatch(now) {
		return 0
	}
	if p.correctScore(m) {
		return correctScore
	}
	if p.correctResult(m) {
		return correctResult
	}
	return 0
}

func (m *Match) isValidMatch(t time.Time) bool {
	// Match is not valid if it won't have finished yet
	if m.Date.After(t.Add(time.Hour * 3)) {
		return false
	}
	return m.HomeScore != nil && m.AwayScore != nil
}

func (p *Prediction) correctScore(m *Match) bool {
	if p.HomeScore == nil || m.HomeScore == nil || p.AwayScore == nil || m.AwayScore == nil {
		return false
	}
	return *p.HomeScore == *m.HomeScore && *p.AwayScore == *m.AwayScore
}

func (p *Prediction) correctResult(m *Match) bool {
	if p.HomeScore == nil || m.HomeScore == nil || p.AwayScore == nil || m.AwayScore == nil {
		return false
	}

	// Predicted tie
	if *p.HomeScore == *p.AwayScore && *m.HomeScore == *m.AwayScore {
		return true
	}

	// Predicted home win
	if *p.HomeScore > *p.AwayScore && *m.HomeScore > *m.AwayScore {
		return true
	}

	// Predicted away win
	if *p.AwayScore > *p.HomeScore && *m.AwayScore > *m.HomeScore {
		return true
	}

	return false
}

func (cp *CompPlacements) top4() []string {
	return []string{
		cp.Winner,
		cp.RunnerUp,
		cp.ThirdPlace,
		cp.FourthPlace,
	}
}

func scoreTeam(i int, guess, actual []string) int {
	if guess[i] == actual[i] {
		return correctPlacement
	}
	if slices.Contains(actual, guess[i]) {
		return incorrectPlacement
	}
	return 0
}

func (t *Tournament) scoreTournament() {
	if !t.Completed {
		return
	}

	tournResIn, err := os.Open("data/tournament_results.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = tournResIn.Close() }()

	results := []*CompPlacements{}
	if err := gocsv.UnmarshalFile(tournResIn, &results); err != nil {
		panic(err)
	}

	if len(results) != 1 {
		panic("expected exactly one tournament results row")
	}

	tournamentResults := results[0]
	t.Placements = tournamentResults
	actual := tournamentResults.top4()

	for _, p := range t.Participants {
		if p.CompPrediction.TopScorer == tournamentResults.TopScorer {
			p.TotalPoints += correctPlacement
		}
		guess := p.CompPrediction.top4()
		for i := range guess {
			p.TotalPoints += scoreTeam(i, guess, actual)
		}
	}
}
