import type { ShiftFormData } from "../types";

export class ShiftService {
  /**
   * Creates and broadcasts a new shift.
   * Backend endpoint: POST /api/shifts
   */
  static async createShift(_data: ShiftFormData): Promise<{ id: string }> {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/shifts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // return response.json();
    return new Promise((resolve) =>
      setTimeout(() => resolve({ id: crypto.randomUUID() }), 800),
    );
  }

  /**
   * Saves a shift as draft.
   * Backend endpoint: POST /api/shifts/draft
   */
  static async saveDraft(
    _data: Partial<ShiftFormData>,
  ): Promise<{ id: string }> {
    // TODO: Replace with actual API call
    return new Promise((resolve) =>
      setTimeout(() => resolve({ id: crypto.randomUUID() }), 400),
    );
  }
}
