<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // branch ownership of the record is checked in the controller via BranchScoped
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z\s]+$/'],
            'branch_id' => ['required', 'exists:branches,id'],
            'sku' => ['nullable', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:20'],
            'stock' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'category.regex' => 'Category must contain letters and spaces only.',
        ];
    }
}
