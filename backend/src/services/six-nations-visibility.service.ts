// Service to handle Six Nations answer visibility logic
// Prevents cheating by hiding other players' answers until matches start

export interface SixNationsAnswerWithMatch {
  id: string;
  userId: string;
  answer: string | null;
  isCorrect: boolean | null;
  question: {
    match: {
      matchDate: Date;
    };
  };
}

export class SixNationsVisibilityService {
  /**
   * Determines if a Six Nations answer should be visible to the requesting user
   * @param answer - The answer to check
   * @param requestingUserId - The ID of the user requesting to view the answer
   * @returns true if the answer should be visible, false otherwise
   */
  isAnswerVisible(
    answer: SixNationsAnswerWithMatch,
    requestingUserId: string
  ): boolean {
    // Own answers are always visible
    if (answer.userId === requestingUserId) {
      return true;
    }

    // Check if match has started
    if (answer.question?.match?.matchDate) {
      const now = new Date();
      const matchDate = new Date(answer.question.match.matchDate);
      return now >= matchDate;
    }

    // If no match date, hide by default
    return false;
  }

  /**
   * Filters answer details based on visibility rules
   * Returns redacted version if answer should be hidden
   * @param answer - The answer to filter
   * @param requestingUserId - The ID of the user requesting to view the answer
   * @returns The answer with details hidden if not visible
   */
  filterAnswerDetails<T extends SixNationsAnswerWithMatch>(
    answer: T,
    requestingUserId: string
  ): T {
    if (this.isAnswerVisible(answer, requestingUserId)) {
      return answer; // Return full answer data
    }

    // Return redacted version with null values for hidden fields
    return {
      ...answer,
      answer: null, // Hide the actual answer
      isCorrect: null, // Hide correctness status
    };
  }

  /**
   * Filters an array of answers based on visibility rules
   * @param answers - Array of answers to filter
   * @param requestingUserId - The ID of the user requesting to view the answers
   * @returns Array of filtered answers
   */
  filterAnswerArray<T extends SixNationsAnswerWithMatch>(
    answers: T[],
    requestingUserId: string
  ): T[] {
    return answers.map((answer) =>
      this.filterAnswerDetails(answer, requestingUserId)
    );
  }
}
