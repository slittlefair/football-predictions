package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func intPtr(i int) *int {
	return &i
}

func TestPrediction_correctScore(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		m    *Match
		p    *Prediction
		want bool
	}{
		{
			name: "Returns true for draw prediction",
			m: &Match{
				HomeScore: intPtr(1),
				AwayScore: intPtr(1),
			},
			p: &Prediction{
				HomeScore: intPtr(1),
				AwayScore: intPtr(1),
			},
			want: true,
		},
		{
			name: "Returns true for home win prediction",
			m:    &Match{HomeScore: intPtr(2), AwayScore: intPtr(1)},
			p:    &Prediction{HomeScore: intPtr(2), AwayScore: intPtr(1)},
			want: true,
		},
		{
			name: "Returns true for away win prediction",
			m:    &Match{HomeScore: intPtr(0), AwayScore: intPtr(3)},
			p:    &Prediction{HomeScore: intPtr(0), AwayScore: intPtr(3)},
			want: true,
		},
		{
			name: "Returns false for incorrect score prediction",
			m:    &Match{HomeScore: intPtr(2), AwayScore: intPtr(3)},
			p:    &Prediction{HomeScore: intPtr(0), AwayScore: intPtr(10)},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.p.correctScore(tt.m)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestPrediction_correctResult(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		m    *Match
		p    *Prediction
		want bool
	}{
		{
			name: "Returns true for home win prediction",
			m:    &Match{HomeScore: intPtr(2), AwayScore: intPtr(1)},
			p:    &Prediction{HomeScore: intPtr(1), AwayScore: intPtr(0)},
			want: true,
		},
		{
			name: "Returns true for away win prediction",
			m:    &Match{HomeScore: intPtr(4), AwayScore: intPtr(5)},
			p:    &Prediction{HomeScore: intPtr(1), AwayScore: intPtr(2)},
			want: true,
		},
		{
			name: "Returns true for draw prediction",
			m:    &Match{HomeScore: intPtr(0), AwayScore: intPtr(0)},
			p:    &Prediction{HomeScore: intPtr(1), AwayScore: intPtr(1)},
			want: true,
		},
		{
			name: "Returns false for incorrect prediction",
			m:    &Match{HomeScore: intPtr(2), AwayScore: intPtr(3)},
			p:    &Prediction{HomeScore: intPtr(0), AwayScore: intPtr(0)},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.p.correctResult(tt.m)
			assert.Equal(t, tt.want, got)
		})
	}
}
