import { useMemo, useState } from "react";

import { Head, router, usePage } from "@inertiajs/react";

import { Archive, Eye, ImagePlus, Package, PackagePlus, Pencil, Plus, Search } from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import ActionDropdown from "@/Components/UI/ActionDropdown";
import Badge from "@/Components/UI/Badge";
import Button from "@/Components/UI/Button";
import ConfirmModal from "@/Components/UI/ConfirmModal";
import DataTable from "@/Components/UI/DataTable";
import Input from "@/Components/UI/Input";
import Modal from "@/Components/UI/Modal";
import Select from "@/Components/UI/Select";

const UNITS = ["oz", "pcs", "g", "kg", "ml", "L", "servings"];

function emptyForm(branchId) {
    return {
        name: "",
        category: "",
        branch_id: branchId || "",
        stock: "0",
        unit: "pcs",
        low_stock_threshold: "10",
        cost_price: "",
    };
}

function IngredientForm({
    initial = null,
    branches,
    categories,
    selectedBranchId,
    onClose,
}) {
    const { props } = usePage();

    const user = props.auth?.user;

    const owner = user?.role === "owner";

    const [form, setForm] = useState(
        initial
            ? {
                  ...initial,

                  stock: String(initial.stock ?? 0),

                  low_stock_threshold: String(
                      initial.low_stock_threshold ?? 10,
                  ),

                  cost_price: initial.cost_price ?? "",
              }
            : emptyForm(selectedBranchId || (!owner ? user?.branch_id : "")),
    );

    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

    function submit(event) {
        event.preventDefault();

        setLoading(true);
        setErrors({});

        const data = {
            ...form,

            branch_id: owner ? form.branch_id : user?.branch_id,
        };

        const options = {
            preserveScroll: true,

            onError: setErrors,

            onSuccess: onClose,

            onFinish: () => setLoading(false),
        };

        if (initial) {
            router.put(route("inventory.update", initial.id), data, options);

            return;
        }

        router.post(route("inventory.store"), data, options);
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input
                label="Ingredient name"
                value={form.name}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,
                        name: value,
                    }))
                }
                error={errors.name}
                placeholder="Okinawa Powder"
                required
            />

            <Select
                label="Category"
                value={form.category}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,
                        category: value,
                    }))
                }
                error={errors.category}
                required
            >
                <option value="">Select category</option>

                {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                        {category.name}
                    </option>
                ))}
            </Select>

            {owner && (
                <Select
                    label="Branch"
                    value={form.branch_id}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            branch_id: value,
                        }))
                    }
                    error={errors.branch_id}
                    required
                >
                    <option value="">Select branch</option>

                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name.replace("Mabi Sip and Bites ", "")}
                        </option>
                    ))}
                </Select>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Current stock"
                    inputModeType="money"
                    value={form.stock}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            stock: value,
                        }))
                    }
                    error={errors.stock}
                    required
                />

                <Select
                    label="Unit"
                    value={form.unit}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            unit: value,
                        }))
                    }
                    error={errors.unit}
                    required
                >
                    {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                            {unit}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Low stock threshold"
                    inputModeType="money"
                    value={form.low_stock_threshold}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,

                            low_stock_threshold: value,
                        }))
                    }
                    error={errors.low_stock_threshold}
                    required
                />

                <Input
                    label="Cost price"
                    inputModeType="money"
                    value={form.cost_price || ""}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,

                            cost_price: value,
                        }))
                    }
                    error={errors.cost_price}
                    placeholder="Optional"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>

                <Button type="submit" loading={loading}>
                    {initial ? "Save changes" : "Add ingredient"}
                </Button>
            </div>
        </form>
    );
}

function CategoryPicture({ url, name }) {
    const [failed, setFailed] = useState(false);
    if (!url || failed) return <ImagePlus className="size-5 text-text-muted" />;
    return <img src={url} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />;
}

function CategoryForm({ initial = null, onClose, selectedBranchId, branches, owner, recipeIngredients = [] }) {
    const [name, setName] = useState(initial?.name || "");
    const [image, setImage] = useState(null);
    const [branchId, setBranchId] = useState(String(initial?.branch_id || selectedBranchId || (!owner ? branches[0]?.id : "")));
    const [showInPos, setShowInPos] = useState(Boolean(initial?.show_in_pos));
    const [price, setPrice] = useState(String(initial?.selling_price ?? ""));
    const [recipe, setRecipe] = useState(initial?.recipe || []);
    function updateRecipe(id, field, value) {
        setRecipe(current => {
            const old = current.find(line => Number(line.ingredient_id) === Number(id)) || { ingredient_id: id };
            return [...current.filter(line => Number(line.ingredient_id) !== Number(id)), { ...old, [field]: value }];
        });
    }
    const [preview, setPreview] = useState(initial?.image_url || null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function selectImage(event) {
        const file = event.target.files?.[0] || null;
        setImage(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submit(event) {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        const url = initial
            ? route("categories.update", initial.id)
            : route("categories.store");

        router.post(url, {
            name,
            image,
            branch_id: branchId,
            show_in_pos: showInPos ? 1 : 0,
            selling_price: showInPos ? price : "",
            ...(showInPos && recipeIngredients.length ? {recipe} : {}),
            ...(initial ? { _method: "PUT" } : {}),
        }, {
            forceFormData: true,
            preserveScroll: true,
            onError: setErrors,
            onSuccess: onClose,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input label="Category name" value={name} onChange={setName}
                error={errors.name} placeholder="Example: Waffles" required />

            {owner && !initial && <Select label="Branch" value={branchId} onChange={setBranchId} required>
                <option value="">Choose a branch</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </Select>}
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showInPos} onChange={(e) => setShowInPos(e.target.checked)} />
                Show as a menu item in Order POS (uncheck for packaging/ingredient-only categories)
            </label>
            {showInPos && <Input label="Selling price (PHP)" value={price} onChange={setPrice}
                error={errors.selling_price} placeholder="99.00" required />}
            {showInPos && <div className="rounded-card border border-border p-3">
                <p className="text-sm font-semibold">Ingredients used per order (required to enable ordering)</p>
                <p className="mb-2 text-xs text-text-secondary">Set required quantity, or 16/18/22 oz quantities for milk tea. Leave unused items empty.</p>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                    {recipeIngredients.map(ingredient => {
                        const line = recipe.find(x => Number(x.ingredient_id) === Number(ingredient.id)) || {};
                        return <div key={ingredient.id} className="grid grid-cols-5 items-center gap-1 text-xs">
                            <span className="truncate" title={ingredient.name}>{ingredient.name}</span>
                            {['quantity_per_order','quantity_16','quantity_18','quantity_22'].map((field, i) =>
                                <input key={field} type="number" min="0" step="0.01" placeholder={['Each','16oz','18oz','22oz'][i]}
                                    className="w-full rounded border p-1 text-xs" value={line[field] ?? ''}
                                    onChange={e => updateRecipe(ingredient.id, field, e.target.value)} />)}
                        </div>;
                    })}
                </div>
            </div>}
            <div>
                <label className="mb-2 block text-sm font-medium">Category / menu image</label>
                <label className="flex cursor-pointer items-center gap-4 rounded-card border border-dashed border-border p-4 hover:bg-muted">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-dropdown bg-muted">
                        {preview
                            ? <img src={preview} alt="Preview" className="size-full object-cover" />
                            : <ImagePlus className="size-6 text-text-muted" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium">Choose an image</p>
                        <p className="mt-1 text-xs text-text-secondary">JPG, PNG or WebP · maximum 5 MB</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={selectImage} className="hidden" />
                </label>
                {errors.image && <p className="mt-1 text-xs text-danger">{errors.image}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={loading}>
                    {initial ? "Save image" : "Add category"}
                </Button>
            </div>
        </form>
    );
}

function CategoryManager({ categories, onClose, selectedBranchId, branches, owner, recipeIngredients = [] }) {
    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);

    if (editing) {
        return (
            <CategoryForm
                initial={editing}
                selectedBranchId={selectedBranchId} branches={branches} owner={owner} recipeIngredients={recipeIngredients}
                onClose={() => {
                    setEditing(null);
                    onClose();
                }}
            />
        );
    }

    if (adding) {
        return (
            <CategoryForm
                selectedBranchId={selectedBranchId} branches={branches} owner={owner} recipeIngredients={recipeIngredients}
                onClose={() => {
                    setAdding(false);
                    onClose();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {categories.map((item) => (
                    <div key={item.id}
                        className="flex items-center gap-3 rounded-card border border-border p-3">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-dropdown bg-muted">
                            <CategoryPicture key={`${item.id}-${item.image_url || 'none'}`} url={item.image_url} name={item.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-xs text-text-secondary">
                                {item.show_in_pos ? `POS item · ₱${Number(item.selling_price || 0).toFixed(2)}` : "Inventory category only"}
                            </p>
                        </div>
                        <Button type="button" variant="outline"
                            onClick={() => setEditing(item)}>
                            Edit
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                            if (window.confirm(`Archive ${item.name} for this branch? Its POS item will disappear, but historical sales are retained.`)) {
                                router.delete(route("categories.destroy", item.id), { preserveScroll: true });
                            }
                        }}>Delete</Button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Close</Button>
                <Button type="button" leftIcon={<Plus className="size-4" />}
                    onClick={() => setAdding(true)}>
                    New category
                </Button>
            </div>
        </div>
    );
}

function InlineStockAdder({ ingredient }) {
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);

    function submit(event) {
        event.preventDefault();
        if (!quantity || Number(quantity) <= 0) return;

        setLoading(true);
        router.patch(route("inventory.add-stock", ingredient.id), { quantity }, {
            preserveScroll: true,
            onSuccess: () => setQuantity(""),
            onFinish: () => setLoading(false),
        });
    }

    const low = Number(ingredient.stock) <= Number(ingredient.low_stock_threshold);

    return (
        <div className="flex min-w-[245px] items-center gap-2">
            <span className={low ? "font-medium text-warning" : ""}>
                {Number(ingredient.stock).toLocaleString()} {ingredient.unit}
            </span>
            <form onSubmit={submit} className="ml-auto flex items-center gap-1">
                <input type="number" min="0.01" step="any" value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="Add" aria-label={`Stock to add for ${ingredient.name}`}
                    className="h-9 w-20 rounded-dropdown border border-border bg-white px-2 text-sm outline-none focus:border-brand" />
                <button type="submit"
                    disabled={loading || !quantity || Number(quantity) <= 0}
                    className="flex size-9 items-center justify-center rounded-dropdown bg-brand text-black disabled:cursor-not-allowed disabled:opacity-50"
                    title="Add stock">
                    <Plus className="size-4" />
                </button>
            </form>
        </div>
    );
}

function AddStockModal({ ingredient, onClose }) {
    const [quantity, setQuantity] = useState("");

    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

    if (!ingredient) {
        return null;
    }

    const newStock = Number(ingredient.stock || 0) + Number(quantity || 0);

    function submit(event) {
        event.preventDefault();

        setLoading(true);

        router.patch(
            route("inventory.add-stock", ingredient.id),
            {
                quantity,
            },
            {
                preserveScroll: true,

                onError: setErrors,

                onSuccess: onClose,

                onFinish: () => setLoading(false),
            },
        );
    }

    return (
        <Modal
            isOpen={!!ingredient}
            onClose={onClose}
            title="Add stock"
            maxWidth="sm"
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-card bg-muted p-4">
                    <p className="font-semibold">{ingredient.name}</p>

                    <p className="mt-1 text-sm text-text-secondary">
                        Current stock: {ingredient.stock} {ingredient.unit}
                    </p>
                </div>

                <Input
                    label={`Quantity to add (${ingredient.unit})`}
                    inputModeType="money"
                    value={quantity}
                    onChange={setQuantity}
                    error={errors.quantity}
                    placeholder="0"
                    required
                />

                <div className="flex justify-between rounded-dropdown bg-muted p-3 text-sm">
                    <span>New stock</span>

                    <strong>
                        {newStock} {ingredient.unit}
                    </strong>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button type="submit" loading={loading}>
                        Add stock
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default function InventoryIndex({
    ingredients = [],
    categories = [],
    selectedBranchId = null,
    recipeIngredients = [],
}) {
    const { props } = usePage();

    const branches = props.branches || [];
    const owner = props.auth?.user?.role === 'owner';

    const [search, setSearch] = useState("");

    const [category, setCategory] = useState("all");

    const [creating, setCreating] = useState(false);

    const [creatingCategory, setCreatingCategory] = useState(false);

    const [editing, setEditing] = useState(null);

    const [viewing, setViewing] = useState(null);

    const [addingStock, setAddingStock] = useState(null);

    const [archiving, setArchiving] = useState(null);

    const [archiveSubmitting, setArchiveSubmitting] = useState(false);

    function confirmArchive() {
        if (!archiving) {
            return;
        }

        setArchiveSubmitting(true);

        router.patch(
            route("archive.archive", {
                module: "inventory",
                id: archiving.id,
            }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setArchiving(null),
                onFinish: () => setArchiveSubmitting(false),
            },
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Category options actually available in this branch
    |--------------------------------------------------------------------------
    */

    const availableCategories = useMemo(
        () => [
            "all",

            ...new Set(
                ingredients.map((item) => item.category).filter(Boolean),
            ),
        ],
        [ingredients],
    );

    /*
    |--------------------------------------------------------------------------
    | Search + category filtering
    |--------------------------------------------------------------------------
    */

    const [stockFilter, setStockFilter] = useState("all");

    const filteredIngredients = useMemo(
        () =>
            ingredients.filter((ingredient) => {
                const stock = Number(ingredient.stock);
                const threshold = Number(ingredient.low_stock_threshold);
                const stockMatches = stockFilter === "all" ||
                    (stockFilter === "out" && stock <= 0) ||
                    (stockFilter === "low" && stock > 0 && stock <= threshold);
                const categoryMatches =
                    category === "all" || ingredient.category === category;

                const searchMatches = ingredient.name
                    .toLowerCase()
                    .includes(search.trim().toLowerCase());

                return categoryMatches && searchMatches && stockMatches;
            }).sort((a, b) => {
                const rank = (item) => Number(item.stock) <= 0 ? 0 :
                    Number(item.stock) <= Number(item.low_stock_threshold) ? 1 : 2;
                return rank(a) - rank(b) || a.name.localeCompare(b.name);
            }),
        [ingredients, category, search, stockFilter],
    );

    const columns = [
        {
            key: "name",
            header: "Ingredient",
        },

        {
            key: "category",
            header: "Category",
        },

        {
            key: "branch_name",
            header: "Branch",
        },

        {
            key: "stock",
            header: "Stock",

            render: (row) => (
                <div className="flex items-center gap-2">
                    <InlineStockAdder ingredient={row} />
                    {Number(row.stock) <= 0 ? (
                        <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Out of stock</span>
                    ) : Number(row.stock) <= Number(row.low_stock_threshold) ? (
                        <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">Low stock</span>
                    ) : null}
                </div>
            ),
        },

        {
            key: "cost_price",
            header: "Cost",

            render: (row) =>
                row.cost_price !== null
                    ? `₱${Number(row.cost_price).toFixed(2)}`
                    : "—",
        },
    ];

    return (
        <AppLayout
            title="Inventory"
            subtitle={
                selectedBranchId
                    ? "Ingredient stock for the selected branch"
                    : "Ingredient stock across branches"
            }
        >
            <Head title="Inventory" />

            {/* FILTERS + ADD */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <div className="w-full sm:max-w-sm">
                        <Input
                            leftIcon={<Search className="size-4" />}
                            value={search}
                            onChange={setSearch}
                            placeholder="Search ingredients..."
                        />
                    </div>

                    <div className="w-full sm:w-64">
                        <Select value={category} onChange={setCategory}>
                            {availableCategories.map((item) => (
                                <option key={item} value={item}>
                                    {item === "all" ? "All categories" : item}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {(search || category !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");

                                setCategory("all");
                            }}
                            className="h-10 whitespace-nowrap rounded-dropdown px-3 text-sm font-medium text-text-secondary hover:bg-muted"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" leftIcon={<ImagePlus className="size-4" />}
                        onClick={() => setCreatingCategory(true)}>
                        Manage categories
                    </Button>
                    <Button leftIcon={<Plus className="size-4" />}
                        onClick={() => setCreating(true)}>
                        Add ingredient
                    </Button>
                </div>
            </div>

            {/* FILTER DESCRIPTION */}
            {category !== "all" && (
                <div className="mb-3 text-sm text-text-secondary">
                    Showing ingredients for{" "}
                    <strong className="text-text-primary">{category}</strong>
                    {" · "}
                    {filteredIngredients.length}{" "}
                    {filteredIngredients.length === 1
                        ? "ingredient"
                        : "ingredients"}
                </div>
            )}

            <div className="mb-3 flex flex-wrap gap-2" aria-label="Stock status filter">
                {[["all", "All stock"], ["low", "Low stock"], ["out", "Out of stock"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setStockFilter(value)}
                        className={`rounded-md border px-3 py-1.5 text-sm ${stockFilter === value ?
                            (value === "out" ? "bg-red-100 border-red-400 text-red-800" : value === "low" ? "bg-yellow-100 border-yellow-400 text-yellow-900" : "bg-brand/20 border-brand") : "border-border bg-white"}`}>
                        {label}
                    </button>
                ))}
            </div>
            <DataTable
                columns={columns}
                data={filteredIngredients}
                actions={(row) => (
                    <ActionDropdown
                        items={[
                            {
                                key: "view",
                                label: "View",

                                icon: Eye,

                                onClick: () => setViewing(row),
                            },

                            {
                                key: "edit",
                                label: "Edit",

                                icon: Pencil,

                                onClick: () => setEditing(row),
                            },

                            {
                                key: "stock",
                                label: "Add stock",

                                icon: PackagePlus,

                                onClick: () => setAddingStock(row),
                            },

                            {
                                key: "archive",
                                label: "Archive",

                                icon: Archive,

                                onClick: () => setArchiving(row),
                            },
                        ]}
                    />
                )}
                emptyIcon={Package}
                emptyTitle={
                    category !== "all"
                        ? `No ${category} ingredients found`
                        : "No ingredients found"
                }
                emptyDescription="Try another category or add an ingredient."
                emptyActionLabel="Add ingredient"
                onEmptyAction={() => setCreating(true)}
            />

            <Modal
                isOpen={creating}
                onClose={() => setCreating(false)}
                title="Add ingredient"
                maxWidth="md"
            >
                <IngredientForm
                    branches={branches}
                    categories={categories}
                    selectedBranchId={selectedBranchId}
                    onClose={() => setCreating(false)}
                />
            </Modal>

            <Modal
                isOpen={creatingCategory}
                onClose={() => setCreatingCategory(false)}
                title="Manage categories"
                maxWidth="md"
            >
                <CategoryManager
                    categories={categories}
                    selectedBranchId={selectedBranchId} branches={branches} owner={owner} recipeIngredients={recipeIngredients}
                    onClose={() => setCreatingCategory(false)}
                />
            </Modal>

            <Modal
                isOpen={!!editing}
                onClose={() => setEditing(null)}
                title="Edit ingredient"
                maxWidth="md"
            >
                {editing && (
                    <IngredientForm
                        initial={editing}
                        branches={branches}
                        categories={categories}
                        selectedBranchId={selectedBranchId}
                        onClose={() => setEditing(null)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={!!viewing}
                onClose={() => setViewing(null)}
                title="Ingredient details"
                maxWidth="sm"
            >
                {viewing && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-text-secondary">
                                Ingredient
                            </p>

                            <p className="font-semibold">{viewing.name}</p>
                        </div>

                        <div>
                            <p className="text-xs text-text-secondary">
                                Category
                            </p>

                            <p>{viewing.category}</p>
                        </div>

                        <div>
                            <p className="text-xs text-text-secondary">
                                Branch
                            </p>

                            <p>{viewing.branch_name}</p>
                        </div>

                        <div>
                            <p className="text-xs text-text-secondary">
                                Current stock
                            </p>

                            <p className="font-semibold">
                                {viewing.stock} {viewing.unit}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-text-secondary">
                                Low stock threshold
                            </p>

                            <p>
                                {viewing.low_stock_threshold} {viewing.unit}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            <AddStockModal
                ingredient={addingStock}
                onClose={() => setAddingStock(null)}
            />

            <ConfirmModal
                isOpen={!!archiving}
                onClose={() => setArchiving(null)}
                onConfirm={confirmArchive}
                intent="archive"
                title="Archive this ingredient?"
                description="It will move to Archived Records and can be restored later."
                loading={archiveSubmitting}
            />
        </AppLayout>
    );
}
