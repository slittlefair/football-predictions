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
	Predictions  []*Prediction
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

type csvPrediction struct {
	Participant string `csv:"Participant"`
	ID          int    `csv:"Match Number"`
	Home        string `csv:"Home"`
	HomeScore   *int   `csv:"Home Score,omitempty"`
	AwayScore   *int   `csv:"Away Score,omitempty"`
	Away        string `csv:"Away"`
	Points      int
	Joker       bool `csv:"Joker"`
}

type Prediction struct {
	ID          int
	Participant string
	HomeScore   int
	AwayScore   int
	Points      int
	Joker       bool
}

type CompPlacements struct {
	Winner            string `csv:"Winner"`
	RunnerUp          string `csv:"Runner Up"`
	ThirdPlace        string `csv:"Third Place"`
	FourthPlace       string `csv:"Fourth Place"`
	TopScorer         string `csv:"Top Scorer"`
	ScorerNationality string `csv:"Nationality"`
}

type TournamentPrediction struct {
	Participant string `csv:"Participant"`
	CompPlacements
}

type Participant struct {
	Name           string
	CompPrediction *TournamentPrediction
	TotalPoints    int
}

const correctScore = 3
const correctResult = 1

const correctPlacement = 5
const incorrectPlacement = 2

func loadMatches() []*Match {
	resIn, err := os.Open("data/score_results.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = resIn.Close() }()

	matches := []*Match{}

	if err := gocsv.UnmarshalFile(resIn, &matches); err != nil {
		panic(err)
	}

	return matches
}

func (t *Tournament) loadPredictions() {
	in, err := os.Open("data/predictions/predictions.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = in.Close() }()

	predictions := []*csvPrediction{}
	if err := gocsv.UnmarshalFile(in, &predictions); err != nil {
		panic(err)
	}

	for _, p := range predictions {
		if p.HomeScore == nil || p.AwayScore == nil {
			continue
		}
		t.Predictions = append(t.Predictions, &Prediction{
			ID:          p.ID,
			HomeScore:   *p.HomeScore,
			AwayScore:   *p.AwayScore,
			Joker:       p.Joker,
			Participant: p.Participant,
		})
	}
}

func (p *Prediction) scoreMatch(m *Match) (int, bool) {
	points, correct := p.calculatePoints(m)
	if p.Joker {
		points *= 2
	}
	return points, correct
}

func (p *Prediction) calculatePoints(m *Match) (int, bool) {
	if m == nil {
		return 0, false
	}
	if m.HomeScore == nil || m.AwayScore == nil {
		return 0, false
	}
	if p.correctScore(m) {
		return correctScore, true
	}
	if p.correctResult(m) {
		return correctResult, false
	}
	return 0, false
}

func (p *Prediction) correctScore(m *Match) bool {
	if m.HomeScore == nil || m.AwayScore == nil {
		return false
	}
	return p.HomeScore == *m.HomeScore && p.AwayScore == *m.AwayScore
}

func (p *Prediction) correctResult(m *Match) bool {
	if m.HomeScore == nil || m.AwayScore == nil {
		return false
	}

	// Predicted tie
	if p.HomeScore == p.AwayScore && *m.HomeScore == *m.AwayScore {
		return true
	}

	// Predicted home win
	if p.HomeScore > p.AwayScore && *m.HomeScore > *m.AwayScore {
		return true
	}

	// Predicted away win
	if p.AwayScore > p.HomeScore && *m.AwayScore > *m.HomeScore {
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
	if actual[i] == "" {
		return 0
	}
	if guess[i] == actual[i] {
		return correctPlacement
	}
	if slices.Contains(actual, guess[i]) {
		return incorrectPlacement
	}
	return 0
}

func (t *Tournament) scoreTournament() {
	tournResIn, err := os.Open("data/tournament_results.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = tournResIn.Close() }()

	results := []*CompPlacements{}
	if err := gocsv.UnmarshalFile(tournResIn, &results); err != nil {
		panic(err)
	}

	if len(results) == 0 {
		return
	}

	if len(results) != 1 {
		panic("expected exactly one tournament results row")
	}

	tournamentResults := results[0]
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

func main() {
	tournament := &Tournament{
		Matches: loadMatches(),
	}

	tournamentPredicions := []*TournamentPrediction{}

	tIn, err := os.Open("data/predictions/Tournament.csv")
	if err != nil {
		panic(err)
	}
	defer func() { _ = tIn.Close() }()

	if err := gocsv.UnmarshalFile(tIn, &tournamentPredicions); err != nil {
		panic(err)
	}

	for _, cp := range tournamentPredicions {
		tournament.Participants = append(tournament.Participants, &Participant{
			Name:           cp.Participant,
			CompPrediction: cp,
		})
	}

	tournament.loadPredictions()

	tournament.scoreTournament()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/leaderboard", tournament.leaderboardHandler())
	mux.HandleFunc("/api/matches", tournament.matchesHandler())
	mux.HandleFunc("/api/matches/{id}", tournament.matchHandler())
	mux.HandleFunc("/api/participants", tournament.participantsHandler())
	mux.HandleFunc("/api/participants/{name}", tournament.participantHandler())
	mux.HandleFunc("/api/tournament", tournament.tournamentHandler())
	mux.HandleFunc("/api/teams", teamsHandler())
	mux.HandleFunc("/api/predictions", tournament.predictionsHandler())

	fmt.Println("Listening on http://localhost:8080")

	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		panic(err)
	}
}
