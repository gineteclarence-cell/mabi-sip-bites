<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isOwner() || $this->user()?->isStaff();
    }

    public function rules(): array
    {
        $owner = $this->user()?->isOwner();

        return [
            'user_id' => [$owner ? 'required' : 'prohibited', 'exists:users,id'],
            'branch_id' => [$owner ? 'required' : 'prohibited', 'exists:branches,id'],
            'work_date' => ['required', 'date_format:Y-m-d'],
            'time_in' => ['nullable', 'date_format:H:i'],
            'time_out' => ['nullable', 'date_format:H:i', 'after_or_equal:time_in'],
            'status' => ['required', Rule::in(['present', 'late', 'absent', 'incomplete'])],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
