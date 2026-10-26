<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'category' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z\s]+$/',
            ],
            'branch_id' => [
                'required',
                'exists:branches,id',
            ],
            'sku' => [
                'nullable',
                'string',
                'max:50',
            ],
            'unit' => [
                'nullable',
                'string',
                'max:20',
            ],
            'stock' => [
                'required',
                'integer',
                'min:0',
            ],
            'low_stock_threshold' => [
                'required',
                'integer',
                'min:0',
            ],
            'cost_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'selling_price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_image' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'category.regex' =>
                'Category must contain letters and spaces only.',
            'image.image' =>
                'The selected file must be a valid image.',
            'image.mimes' =>
                'The product image must be a JPG, JPEG, PNG, or WebP file.',
            'image.max' =>
                'The product image must not exceed 5 MB.',
        ];
    }
}