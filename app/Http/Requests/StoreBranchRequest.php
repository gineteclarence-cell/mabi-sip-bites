<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only owner manages branches — enforced again in controller via role check,
        // this is just the request-level gate.
        return $this->user()->isOwner();
    }

    public function rules(): array
    {
        return [
            // Branch names legitimately contain numbers/punctuation (e.g. "Branch 1",
            // "Mabi Sip & Bites"), so this is intentionally text, not alpha-only —
            // matches 06_TABLES_ARCHIVE_CRUD.md's "Branch name alpha/text" wording.
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'regex:/^09\d{9}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'contact_number.regex' => 'Contact number must be 11 digits starting with 09.',
        ];
    }
}
