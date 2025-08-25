<script lang="ts" module>
    type Status = 'idle' | 'uploading' | 'success' | 'error';

    export type PresignResult = {
        url: string;
        method: string;
        headers?: Record<string, string>;
        fields?: Record<string, string>;
        key?: string;
    };

    export interface FileItem {
        id: string;
        file: File;
        url?: string;
        progress: number;
        status: Status;
        error?: string;
        key?: string;
        xhr?: XMLHttpRequest | null;
        default?: boolean;
    }

    export interface DefaultFileItem {
        id: string;
        name: string;
        url: string;
        mime: string;
    }
</script>

<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { slide } from 'svelte/transition';

    interface Props extends HTMLAttributes<HTMLInputElement> {
        name?: string;
        multiple?: boolean;
        onChange?: ({ items, removed }: { items: FileItem[]; removed: string[] }) => void;
        maxSize?: number;
        presign: (file: File) => Promise<PresignResult>;
        defaults?: DefaultFileItem[];
    }
    const { name, multiple, onChange, maxSize, presign, defaults, ...rest }: Props = $props();

    let input = $state<HTMLInputElement>();
    const openPicker = () => input?.click();

    let items = $state<FileItem[]>([]);
    let removed = $state<string[]>([]);

    $effect(() => {
        if (!defaults || !defaults.length || items.length) return;
        const newItems = defaults.map(
            ({ id, name, mime, url }) =>
                ({
                    id,
                    file: new File([''], name, { type: mime, lastModified: Date.now() }),
                    url,
                    progress: 0,
                    status: 'idle',
                    default: true
                }) satisfies FileItem
        );
        items.push(...newItems);
        onChange?.({ items, removed });
    });

    function addFiles(files: FileList | File[]) {
        const array = Array.from(files);
        const newItems: FileItem[] = array.map((file) => ({
            id: crypto.randomUUID(),
            file,
            url: URL.createObjectURL(file),
            progress: 0,
            status: 'idle'
        }));

        if (multiple) {
            items.push(...newItems);
        } else {
            items.forEach((item) => item?.xhr?.abort());
            items = [newItems[0]];
        }

        onChange?.({ items, removed });

        queueMicrotask(() => newItems.forEach(uploadItem));
    }

    async function uploadItem(item: FileItem) {
        if (item.default) return;

        const index = items.findIndex((i) => i.id === item.id);
        if (index === -1) return;

        function patch(data: Partial<FileItem>) {
            items[index] = { ...items[index], ...data };
            onChange?.({ items, removed });
        }

        if (maxSize && item.file.size > maxSize) {
            patch({ status: 'error', error: 'File is too large' });
            return;
        }

        patch({ status: 'uploading', progress: 0 });

        try {
            const xhr = new XMLHttpRequest();
            const signed = await presign(item.file);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    patch({ progress: percentage });
                }
            };

            xhr.onerror = () => {
                patch({ status: 'error', error: 'Network error' });
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    patch({ status: 'success', key: signed.key, progress: 100 });
                    return;
                }

                patch({ status: 'error', error: `Upload failed (${xhr.status})` });
            };

            xhr.open(signed.method, signed.url);
            patch({ xhr });

            if (signed.headers) {
                Object.entries(signed.headers).forEach(([key, value]) => {
                    if (key.toLowerCase() === 'content-type' && signed.fields) return;
                    xhr.setRequestHeader(key, value);
                });
            }

            if (signed.fields) {
                const formData = new FormData();
                Object.entries(signed.fields).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                formData.append('file', item.file);
                xhr.send(formData);
            } else {
                if (!signed.headers || !('Content-Type' in signed.headers)) {
                    xhr.setRequestHeader(
                        'Content-Type',
                        item.file.type || 'application/octet-stream'
                    );
                }
                xhr.send(item.file);
            }
        } catch {
            patch({ status: 'error', error: 'Something went wrong' });
        }
    }

    function removeItem(item: FileItem) {
        items = items.filter((i) => i.id !== item.id);

        if (item.default) {
            removed.push(item.id);
            onChange?.({ items, removed });
            return;
        }

        if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
        if (item.xhr) item.xhr.abort();

        onChange?.({ items, removed });
    }

    function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
        const files = event.currentTarget.files;
        if (files) addFiles(files);
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
    }
</script>

<input {...rest} type="file" class="hidden" bind:this={input} onchange={handleChange} {multiple} />

{#if name}
    {#each items as item (item.id)}
        {#if item.key}
            <input type="hidden" name="{name}[]" value={item.key} />
        {/if}
    {/each}
{/if}

<div
    class="flex items-center justify-center gap-4 rounded-lg bg-neutral-800 p-10"
    role="region"
    ondragover={(e) => e.preventDefault()}
    ondrop={handleDrop}
>
    Drag and drop or
    <button
        onclick={openPicker}
        class="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2"
    >
        Open file picker
    </button>
</div>

{#if items.length}
    <div class="flex flex-col gap-4">
        {#each items as item (item.id)}
            <div
                transition:slide={{ duration: 200 }}
                class={[
                    'flex flex-col gap-4 rounded-lg border p-4',
                    item.status === 'uploading'
                        ? 'border-blue-500'
                        : item.status === 'success'
                          ? 'border-green-500'
                          : item.status === 'error'
                            ? 'border-red-500'
                            : 'border-neutral-700'
                ]}
            >
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        {#if item.url && item.file.type.startsWith('image/')}
                            <img
                                src={item.url}
                                alt={item.file.name}
                                class="h-20 w-20 object-cover"
                            />
                        {:else}
                            <p class="flex h-20 w-20 items-center justify-center">F</p>
                        {/if}
                        <p>
                            {item.file.name ?? 'Unnamed'} ({item.status})
                        </p>
                    </div>
                    <button class="cursor-pointer text-red-500" onclick={() => removeItem(item)}>
                        Remove
                    </button>
                </div>
                {#if item.status === 'uploading'}
                    <progress value={item.progress} max="100"></progress>
                {/if}
            </div>
        {/each}
    </div>
{/if}
