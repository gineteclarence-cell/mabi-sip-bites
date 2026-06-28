<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'work_date' => ['required', 'date'],
            'time_in' => ['nullable', 'date'],
            'time_out' => ['nullable', 'date', 'after_or_equal:time_in'],
            'status' => ['required', Rule::in(['present', 'late', 'absent', 'incomplete'])],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
