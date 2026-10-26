import { useCallback, useState } from "react";
import { router } from "@inertiajs/react";

function containsFile(value) {
    if (value instanceof File || value instanceof Blob) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.some(containsFile);
    }

    if (value && typeof value === "object") {
        return Object.values(value).some(containsFile);
    }

    return false;
}

export function useArchivableRecords({
    records,
    storeRoute,
    updateRouteName,
    module,
}) {
    const [creating, setCreating] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [archiving, setArchiving] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openCreate = useCallback(() => setCreating(true), []);

    const closeCreate = useCallback(() => setCreating(false), []);

    const openView = useCallback((record) => setViewing(record), []);

    const closeView = useCallback(() => setViewing(null), []);

    const openEdit = useCallback((record) => setEditing(record), []);

    const closeEdit = useCallback(() => setEditing(null), []);

    const openArchive = useCallback((record) => setArchiving(record), []);

    const closeArchive = useCallback(() => setArchiving(null), []);

    const openRestore = useCallback((record) => setRestoring(record), []);

    const closeRestore = useCallback(() => setRestoring(null), []);

    const openDelete = useCallback((record) => setDeleting(record), []);

    const closeDelete = useCallback(() => setDeleting(null), []);

    const createRecord = useCallback(
        (data, options = {}) => {
            setIsSubmitting(true);

            router.post(route(storeRoute), data, {
                forceFormData: containsFile(data),
                onSuccess: () => setCreating(false),
                onError: (errors) => options.onError?.(errors),
                onFinish: () => setIsSubmitting(false),
            });
        },
        [storeRoute],
    );

    const updateRecord = useCallback(
        (id, data, options = {}) => {
            setIsSubmitting(true);

            if (containsFile(data)) {
                router.post(
                    route(updateRouteName, id),
                    {
                        ...data,
                        _method: "patch",
                    },
                    {
                        forceFormData: true,
                        onSuccess: () => setEditing(null),
                        onError: (errors) => options.onError?.(errors),
                        onFinish: () => setIsSubmitting(false),
                    },
                );

                return;
            }

            router.patch(route(updateRouteName, id), data, {
                onSuccess: () => setEditing(null),
                onError: (errors) => options.onError?.(errors),
                onFinish: () => setIsSubmitting(false),
            });
        },
        [updateRouteName],
    );

    const confirmArchive = useCallback(() => {
        if (!archiving) return;

        setIsSubmitting(true);

        router.patch(
            route("archive.archive", {
                module,
                id: archiving.id,
            }),
            {},
            {
                onSuccess: () => setArchiving(null),
                onFinish: () => setIsSubmitting(false),
            },
        );
    }, [archiving, module]);

    const confirmRestore = useCallback(() => {
        if (!restoring) return;

        setIsSubmitting(true);

        router.patch(
            route("archive.restore", {
                module,
                id: restoring.id,
            }),
            {},
            {
                onSuccess: () => setRestoring(null),
                onFinish: () => setIsSubmitting(false),
            },
        );
    }, [restoring, module]);

    const confirmDelete = useCallback(() => {
        if (!deleting) return;

        setIsSubmitting(true);

        router.delete(
            route("archive.destroy", {
                module,
                id: deleting.id,
            }),
            {
                onSuccess: () => setDeleting(null),
                onFinish: () => setIsSubmitting(false),
            },
        );
    }, [deleting, module]);

    return {
        records,
        isSubmitting,
        creating,
        viewing,
        editing,
        archiving,
        restoring,
        deleting,
        openCreate,
        closeCreate,
        createRecord,
        openView,
        closeView,
        openEdit,
        closeEdit,
        updateRecord,
        openArchive,
        closeArchive,
        confirmArchive,
        openRestore,
        closeRestore,
        confirmRestore,
        openDelete,
        closeDelete,
        confirmDelete,
    };
}
