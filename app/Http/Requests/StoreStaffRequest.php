<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffId = $this->route('staff'); // present on update, null on create

        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z\s]+$/'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($staffId)],
            'contact_number' => ['nullable', 'regex:/^09\d{9}$/'],
            'role' => ['required', Rule::in(['owner', 'manager', 'staff'])],
            'branch_id' => ['nullable', 'exists:branches,id', 'required_unless:role,owner'],
            // Password required on create, optional on update (leave blank to keep current).
            'password' => [$staffId ? 'nullable' : 'required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Name must contain letters and spaces only.',
            'contact_number.regex' => 'Contact number must be 11 digits starting with 09.',
            'branch_id.required_unless' => 'Branch is required for this role.',
        ];
    }
}
