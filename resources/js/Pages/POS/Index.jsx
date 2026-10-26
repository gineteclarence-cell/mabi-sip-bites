import { useMemo, useState } from "react";

function ProductPicture({ src, alt, className, placeholderClassName, iconClassName }) {
    const [broken, setBroken] = useState(false);
    if (!src || broken) {
        return <div className={placeholderClassName}><ImageOff className={iconClassName} /></div>;
    }
    return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}


import { Head, router, usePage } from "@inertiajs/react";

import {
    AlertCircle,
    Building2,
    ImageOff,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
} from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import Button from "@/Components/UI/Button";
import Input from "@/Components/UI/Input";
import Select from "@/Components/UI/Select";

const SIZES = [16, 18, 22];

function normalizeCategory(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function getAvailability(product, sizeOz = null) {
    if (!product.inventory_configured) {
        return {
            available: false,
            maximum: 0,
            limiting_ingredient: null,
            reason: "Inventory recipe not configured.",
        };
    }

    if (product.is_milk_tea) {
        return (
            product.availability?.[String(sizeOz || 16)] ?? {
                available: false,
                maximum: 0,
                limiting_ingredient: null,
                reason: "Inventory unavailable.",
            }
        );
    }

    return (
        product.availability?.default ?? {
            available: false,
            maximum: 0,
            limiting_ingredient: null,
            reason: "Inventory unavailable.",
        }
    );
}

export default function POSIndex({
    selectedBranchId = null,
    productOptions = [],
    categoryOptions = [],
}) {
    console.log("CATEGORY OPTIONS:", categoryOptions);
    console.log("PRODUCT OPTIONS:", productOptions);

    const { props } = usePage();

    const user = props.auth?.user;

    const owner = user?.role === "owner";

    const [category, setCategory] = useState("all");

    const [search, setSearch] = useState("");

    const [cart, setCart] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const [errors, setErrors] = useState({});

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    const categories = useMemo(
        () => [
            "all",

            ...new Set(
                productOptions
                    .map((product) => product.category)
                    .filter(Boolean),
            ),
        ],
        [productOptions],
    );

    const categoryImages = useMemo(
        () =>
            Object.fromEntries(
                categoryOptions.map((item) => [
                    normalizeCategory(item.name),
                    item.image_url,
                ]),
            ),
        [categoryOptions],
    );

    const visibleProducts = productOptions.filter((product) => {
        const matchesCategory =
            category === "all" || product.category === category;

        const matchesSearch = product.name
            .toLowerCase()
            .includes(search.trim().toLowerCase());

        return matchesCategory && matchesSearch;
    });

    /*
    |--------------------------------------------------------------------------
    | Shared ingredient usage already reserved in cart
    |--------------------------------------------------------------------------
    */

    function getCartIngredientUsage(ingredientId, excludeKey = null) {
        return cart
            .filter((line) => line.key !== excludeKey)
            .reduce((total, line) => {
                const ingredient = line.product.ingredients?.find(
                    (item) => item.id === ingredientId,
                );

                if (!ingredient) {
                    return total;
                }

                let required = 0;

                if (line.product.is_milk_tea) {
                    required = Number(
                        ingredient[`quantity_${line.size_oz}`] ?? 0,
                    );
                } else {
                    required = Number(ingredient.quantity_per_order ?? 0);
                }

                return total + required * line.quantity;
            }, 0);
    }

    /*
    |--------------------------------------------------------------------------
    | Maximum quantity based on ALL required ingredients
    |--------------------------------------------------------------------------
    */

    function getMaximumForLine(line) {
        const ingredients = line.product.ingredients || [];

        if (!ingredients.length) {
            return 0;
        }

        let maximum = null;

        for (const ingredient of ingredients) {
            let perOrder = 0;

            if (line.product.is_milk_tea) {
                perOrder = Number(ingredient[`quantity_${line.size_oz}`] ?? 0);
            } else {
                perOrder = Number(ingredient.quantity_per_order ?? 0);
            }

            if (perOrder <= 0) {
                continue;
            }

            const alreadyUsed = getCartIngredientUsage(ingredient.id, line.key);

            const remaining = Math.max(
                0,
                Number(ingredient.stock ?? 0) - alreadyUsed,
            );

            const possible = Math.floor(remaining / perOrder);

            if (maximum === null || possible < maximum) {
                maximum = possible;
            }
        }

        return maximum ?? 0;
    }

    function getLimitingIngredient(line) {
        const ingredients = line.product.ingredients || [];

        let minimum = null;

        let limiting = null;

        for (const ingredient of ingredients) {
            let perOrder = 0;

            if (line.product.is_milk_tea) {
                perOrder = Number(ingredient[`quantity_${line.size_oz}`] ?? 0);
            } else {
                perOrder = Number(ingredient.quantity_per_order ?? 0);
            }

            if (perOrder <= 0) {
                continue;
            }

            const alreadyUsed = getCartIngredientUsage(ingredient.id, line.key);

            const remaining = Math.max(
                0,
                Number(ingredient.stock ?? 0) - alreadyUsed,
            );

            const possible = Math.floor(remaining / perOrder);

            if (minimum === null || possible < minimum) {
                minimum = possible;

                limiting = ingredient.name;
            }
        }

        return limiting;
    }

    /*
    |--------------------------------------------------------------------------
    | Add product
    |--------------------------------------------------------------------------
    */

    function add(product) {
        if (!product.inventory_configured) {
            return;
        }

        const sizeOz = product.is_milk_tea ? 16 : null;

        const availability = getAvailability(product, sizeOz);

        if (!availability.available || availability.maximum <= 0) {
            return;
        }

        setCart((current) => {
            const existing = current.find(
                (line) =>
                    line.product.id === product.id && line.size_oz === sizeOz,
            );

            if (existing) {
                const maximum = getMaximumForLine(existing);

                if (existing.quantity >= maximum) {
                    return current;
                }

                return current.map((line) =>
                    line.key === existing.key
                        ? {
                              ...line,

                              quantity: line.quantity + 1,
                          }
                        : line,
                );
            }

            return [
                ...current,

                {
                    key: `${product.id}-${sizeOz}-${Date.now()}`,

                    product,

                    quantity: 1,

                    size_oz: sizeOz,
                },
            ];
        });
    }

    function updateLine(key, values) {
        setCart((current) =>
            current.map((line) =>
                line.key === key
                    ? {
                          ...line,
                          ...values,
                      }
                    : line,
            ),
        );
    }

    function removeLine(key) {
        setCart((current) => current.filter((line) => line.key !== key));
    }

    function decrease(line) {
        updateLine(line.key, {
            quantity: Math.max(1, line.quantity - 1),
        });
    }

    function increase(line) {
        const maximum = getMaximumForLine(line);

        if (line.quantity >= maximum) {
            return;
        }

        updateLine(line.key, {
            quantity: line.quantity + 1,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Size change
    |--------------------------------------------------------------------------
    */

    function changeSize(line, value) {
        const size = Number(value);

        const temporary = {
            ...line,
            size_oz: size,
        };

        const ingredients = temporary.product.ingredients || [];

        let maximum = null;

        for (const ingredient of ingredients) {
            const perOrder = Number(ingredient[`quantity_${size}`] ?? 0);

            if (perOrder <= 0) {
                continue;
            }

            const alreadyUsed = getCartIngredientUsage(ingredient.id, line.key);

            const remaining = Math.max(
                0,
                Number(ingredient.stock ?? 0) - alreadyUsed,
            );

            const possible = Math.floor(remaining / perOrder);

            if (maximum === null || possible < maximum) {
                maximum = possible;
            }
        }

        maximum ??= 0;

        updateLine(line.key, {
            size_oz: size,

            quantity: maximum > 0 ? Math.min(line.quantity, maximum) : 1,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Cart validation
    |--------------------------------------------------------------------------
    */

    const cartHasStockProblem = cart.some(
        (line) => getMaximumForLine(line) < line.quantity,
    );

    const total = cart.reduce(
        (sum, line) => sum + Number(line.product.selling_price) * line.quantity,
        0,
    );

    /*
    |--------------------------------------------------------------------------
    | Complete order
    |--------------------------------------------------------------------------
    |
    | Customer has been completely removed from POS.
    |
    */

    function completeOrder() {
        if (!selectedBranchId || !cart.length || cartHasStockProblem) {
            return;
        }

        setSubmitting(true);

        setErrors({});

        router.post(
            route("sales.store"),
            {
                branch_id: selectedBranchId,

                payment_method: "cash",

                items: cart.map((line) => ({
                    product_id: line.product.id,

                    quantity: line.quantity,

                    size_oz: line.size_oz,
                })),
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setCart([]);
                },

                onError: setErrors,

                onFinish: () => setSubmitting(false),
            },
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Owner must select a branch
    |--------------------------------------------------------------------------
    */

    if (owner && !selectedBranchId) {
        return (
            <AppLayout
                title="Order"
                subtitle="Select a branch to start an order"
            >
                <Head title="Order" />

                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="max-w-md rounded-card border border-border bg-white px-8 py-10 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand/20">
                            <Building2 className="size-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold">
                            Select a branch
                        </h2>

                        <p className="mt-2 text-sm text-text-secondary">
                            Select Branch 1 or Branch 2 using the branch
                            selector at the top-right.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Order"
            subtitle="Tap to build an order, then complete the order"
        >
            <Head title="Order" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                {/* PRODUCTS */}
                <div className="min-w-0">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <div className="w-full sm:max-w-sm">
                            <Input
                                leftIcon={<Search className="size-4" />}
                                value={search}
                                onChange={setSearch}
                                placeholder="Search products..."
                            />
                        </div>

                        <div className="w-full sm:w-48">
                            <Select value={category} onChange={setCategory}>
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item === "all"
                                            ? "All categories"
                                            : item}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                        {visibleProducts.map((product) => {
                            const displayedImage =
                                product.image_url ||
                                categoryImages[
                                    normalizeCategory(product.name)
                                ] ||
                                categoryImages[
                                    normalizeCategory(product.category)
                                ];

                            const availability = getAvailability(
                                product,
                                product.is_milk_tea ? 16 : null,
                            );

                            const notConfigured = !product.inventory_configured;

                            const unavailable =
                                notConfigured || !availability.available;

                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    disabled={unavailable}
                                    onClick={() => add(product)}
                                    className="overflow-hidden rounded-card border border-border bg-white text-left transition hover:border-brand hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <div className="flex aspect-square items-center justify-center bg-muted">
                                        <ProductPicture
                                            key={`${product.id}-${displayedImage || 'none'}`}
                                            src={displayedImage}
                                            alt={product.name}
                                            className="size-full object-cover"
                                            placeholderClassName="flex size-full items-center justify-center"
                                            iconClassName="size-8 text-text-muted"
                                        />
                                    </div>

                                    <div className="p-3">
                                        <p className="truncate text-sm font-medium">
                                            {product.name}
                                        </p>

                                        <p className="font-semibold">
                                            ₱
                                            {Number(
                                                product.selling_price,
                                            ).toFixed(2)}
                                        </p>

                                        {notConfigured ? (
                                            <p className="mt-1 text-xs font-medium text-danger">
                                                Inventory not configured
                                            </p>
                                        ) : !availability.available ? (
                                            <p className="mt-1 text-xs font-medium text-danger">
                                                Out of stock
                                                {availability.limiting_ingredient
                                                    ? ` • ${availability.limiting_ingredient}`
                                                    : ""}
                                            </p>
                                        ) : (
                                            <p className="mt-1 text-xs text-text-secondary">
                                                {availability.maximum}{" "}
                                                {product.is_milk_tea
                                                    ? availability.maximum === 1
                                                        ? "cup available"
                                                        : "cups available"
                                                    : availability.maximum === 1
                                                      ? "order available"
                                                      : "orders available"}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CURRENT ORDER */}
                <aside className="rounded-card border border-border bg-white p-4">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <ShoppingCart className="size-4" />
                        Current order
                    </h2>

                    <div className="my-4 divide-y divide-border">
                        {cart.length ? (
                            cart.map((line) => {
                                const maximum = getMaximumForLine(line);

                                const limitingIngredient =
                                    getLimitingIngredient(line);

                                const reachedMaximum = line.quantity >= maximum;

                                return (
                                    <div
                                        key={line.key}
                                        className="space-y-3 py-4"
                                    >
                                        <div className="flex justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <ProductPicture
                                                    key={`${line.product.id}-${line.product.image_url || categoryImages[normalizeCategory(line.product.category)] || 'none'}`}
                                                    src={line.product.image_url || categoryImages[normalizeCategory(line.product.category)]}
                                                    alt={line.product.name}
                                                    className="size-10 shrink-0 rounded-md object-cover"
                                                    placeholderClassName="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted"
                                                    iconClassName="size-4 text-text-muted"
                                                />
                                                <span className="text-sm font-medium">{line.product.name}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeLine(line.key)
                                                }
                                                className="text-text-muted hover:text-danger"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>

                                        {line.product.is_milk_tea && (
                                            <Select
                                                label="Size"
                                                value={line.size_oz}
                                                onChange={(value) =>
                                                    changeSize(line, value)
                                                }
                                            >
                                                {SIZES.map((size) => (
                                                    <option
                                                        key={size}
                                                        value={size}
                                                    >
                                                        {size} oz
                                                    </option>
                                                ))}
                                            </Select>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        decrease(line)
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-dropdown border border-border hover:bg-muted"
                                                >
                                                    <Minus className="size-4" />
                                                </button>

                                                <span className="min-w-7 text-center text-sm font-semibold">
                                                    {line.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={reachedMaximum}
                                                    onClick={() =>
                                                        increase(line)
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-dropdown border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>

                                            <strong>
                                                ₱
                                                {(
                                                    Number(
                                                        line.product
                                                            .selling_price,
                                                    ) * line.quantity
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div className="rounded-dropdown bg-muted p-3">
                                            <p className="text-xs text-text-secondary">
                                                Maximum available:{" "}
                                                <strong className="text-text-primary">
                                                    {maximum}{" "}
                                                    {line.product.is_milk_tea
                                                        ? maximum === 1
                                                            ? "cup"
                                                            : "cups"
                                                        : maximum === 1
                                                          ? "order"
                                                          : "orders"}
                                                </strong>
                                            </p>

                                            {limitingIngredient && (
                                                <p className="mt-1 text-xs text-text-secondary">
                                                    Limited by:{" "}
                                                    <strong className="text-text-primary">
                                                        {limitingIngredient}
                                                    </strong>
                                                </p>
                                            )}

                                            {reachedMaximum && (
                                                <p className="mt-2 text-xs font-medium text-danger">
                                                    Maximum available stock
                                                    reached.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="py-10 text-center text-sm text-text-secondary">
                                Tap a product to add it here.
                            </p>
                        )}
                    </div>

                    {/* CUSTOMER DROPDOWN REMOVED */}

                    <div className="mt-4 rounded-dropdown bg-muted p-3 text-sm">
                        <span>Payment method</span>

                        <strong className="float-right">Cash</strong>
                    </div>

                    {errors.items && (
                        <div className="mt-3 flex gap-2 rounded-dropdown bg-red-50 p-3 text-xs text-danger">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />

                            <span>{errors.items}</span>
                        </div>
                    )}

                    <div className="my-4 flex justify-between rounded-dropdown bg-muted p-3">
                        <span>Total</span>

                        <strong>₱{total.toFixed(2)}</strong>
                    </div>

                    <Button
                        className="w-full"
                        onClick={completeOrder}
                        loading={submitting}
                        disabled={!cart.length || cartHasStockProblem}
                    >
                        Complete order
                    </Button>
                </aside>
            </div>
        </AppLayout>
    );
}
