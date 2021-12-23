import {Question} from './questions';
import {BestMoves} from './stockfish';

export interface QuestionResult {
	question: Question;
	stockfishEval: BestMoves;
	answer: Answer;
}

/**
 * 1. 20 points for correctly guessing the winning side or that the position is a draw
 *
 * 2. The number of points for the eval guess is given by -16 |guess - actual_eval| + 50
 * Eval difference vs points awarded table
 * 0: 50
 * 0.5: 42
 * 1: 34
 * 2: 18
 * 3: 2
 * 4: -14
 * 5: -30
 * 6: -46
 * 10: -110
 *
 * 3. Guessing a best move multiplies your eval points by max(-0.75 abs(guessEval - bestMoveEval) + 3, 1)
 * 0: x3.0
 * 1: x2.25
 * 2: x1.5
 * 2.66: x1.0
 *
 * 4. Guessing a player or the tournament awards 10 points
 */
export class PointsSolver {
	public readonly result: QuestionResult;

	constructor(result: QuestionResult) {
		this.result = result;
	}

	/**
	 * @returns true if the winning side was found
	 */
	foundWinningSide(): boolean {
		return this.result.answer.evaluation * this.result.stockfishEval[0].evaluation > 0;
	}

	/**
	 * @returns Points awarded for eval
	 */
	evalPoints(): number {
		return -16 * Math.abs(this.result.answer.evaluation - this.result.stockfishEval[0].evaluation) + 50;
	}

	/**
	 * @returns true if guessed move was in the top 3
	 */
	foundBestMove(): boolean {
		const bestMove = this.result.stockfishEval.find(
			variation => variation.move === this.result.answer.bestMove
		);
		return bestMove !== undefined;
	}

	/**
	 * @returns Eval points multiplier
	 */
	bestMoveMultiplier(): number {
		const bestMove = this.result.stockfishEval.find(
			variation => variation.move === this.result.answer.bestMove
		);
		if (bestMove === undefined) {
			return 1;
		}

		return Math.max(-0.75 * Math.abs(bestMove.evaluation - this.result.stockfishEval[0].evaluation) + 3, 1)
	}

	/**
	 * @returns true if a player or tournament was guessed
	 */
	foundPlayerOrTournament(): boolean {
		const possibleWords = new Set<string>();
		const strings = [
			this.result.question.players.white,
			this.result.question.players.black,
			this.result.question.tournament,
		];
		for (const s of strings) {
			for (const word of s.split(' ')) {
				possibleWords.add(word);
			}
		}

		for (const word of this.result.answer.playerOrTournament.split(' ')) {
			if (possibleWords.has(word)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @returns Points awarded for question
	 */
	totalPoints(): number {
		return (this.foundWinningSide() ? 20 : 0)
			+ this.evalPoints() * this.bestMoveMultiplier()
			+ (this.foundPlayerOrTournament() ? 10 : 0);
	}
}

export interface Answer {
	evaluation: number,
	bestMove: string,
	playerOrTournament: string,
}
