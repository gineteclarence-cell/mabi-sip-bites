<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn (Branch $branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'location' => $branch->location,
                'contact_number' => $branch->contact_number,
                'status' => $branch->status,
            ]);

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        Branch::create($request->validated());

        return redirect()->back()->with('success', 'Branch created successfully.');
    }

    public function update(StoreBranchRequest $request, Branch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        return redirect()->back()->with('success', 'Branch updated successfully.');
    }
}
