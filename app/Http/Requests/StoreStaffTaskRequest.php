<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'branch_id' => ['required', 'exists:branches,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'status' => ['required', Rule::in(['pending', 'in_progress', 'completed'])],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
