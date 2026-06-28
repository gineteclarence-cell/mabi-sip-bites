<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'staff_id' => ['required', 'exists:users,id'],
            'payment_method' => ['required', Rule::in(['cash', 'gcash', 'other'])],
            // Items drive stock deduction (07_BACKEND_CONTROLLERS_AND_ROUTES.md ->
            // "Inventory Stock Behavior"). total_amount is recalculated server-side
            // from these items rather than trusted from the client, so a tampered
            // total can't be submitted.
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
