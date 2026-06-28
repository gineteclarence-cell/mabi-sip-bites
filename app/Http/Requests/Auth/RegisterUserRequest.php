<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * RegisterUserRequest
 *
 * The Laravel React starter kit's default registration controller
 * validates name/email/password inline rather than via a dedicated Form
 * Request, and does not know about contact_number, alpha-only name
 * rules, or this project's password-symbol requirement. This class
 * fills that gap so Register.jsx's backend validation matches every
 * other form in the app (same rules as StoreStaffRequest).
 *
 * To wire this in: open the starter kit's
 * app/Http/Controllers/Auth/RegisteredUserController.php and change its
 * store() method signature from `Request $request` to
 * `RegisterUserRequest $request`, then delete that method's inline
 * `$request->validate([...])` call since this class now owns validation.
 * Role and branch_id are deliberately NOT accepted from this form — per
 * 04_AUTH_AND_LAYOUT.md, self-registration should not let a user pick
 * their own role. The controller should hardcode role => 'staff' and
 * branch_id => null (or your chosen default branch) when calling
 * User::create(), not read either from request input.
 */
class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z\s]+$/'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'contact_number' => ['nullable', 'regex:/^09\d{9}$/'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Name must contain letters and spaces only.',
            'contact_number.regex' => 'Contact number must be 11 digits starting with 09.',
        ];
    }
}
