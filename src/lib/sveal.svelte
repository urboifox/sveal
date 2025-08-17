<script lang="ts">
    import { cubicOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/rose-pine.css';
    import type { Slide } from '$lib/types';

    interface Props {
        slides: Slide[];
    }
    const { slides }: Props = $props();

    let activeIndex = $state(0);
    let cursorHidden = $state(false);

    function next() {
        activeIndex++;
    }

    function prev() {
        activeIndex--;
    }

    $effect(() => {
        const controller = new AbortController();

        addEventListener(
            'keydown',
            (event) => {
                if (event.key === 'ArrowRight') {
                    if (activeIndex === slides.length - 1) return;
                    next();
                }
                if (event.key === 'ArrowLeft') {
                    if (activeIndex <= 0) return;
                    prev();
                }
                if (event.key === 's') {
                    const value = prompt('Enter slide number');
                    if (!value) return;
                    const parsed = parseInt(value);
                    if (parsed < 1 || parsed > slides.length) return;
                    activeIndex = parsed - 1;
                }
            },
            { signal: controller.signal }
        );

        let timeout: number;
        addEventListener(
            'mousemove',
            () => {
                cursorHidden = false;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    cursorHidden = true;
                }, 1000);
            },
            { signal: controller.signal }
        );

        return () => {
            controller.abort();
        };
    });

    function formatCode(str: string) {
        // Remove leading/trailing empty lines
        str = str.replace(/^\s*\n|\n\s*$/g, '');

        // Find smallest indentation across all non-empty lines
        const indent = Math.min(
            ...str
                .split('\n')
                .filter((line) => line.trim()) // ignore empty lines
                .map((line) => line.match(/^(\s*)/)![0].length)
        );

        // Remove that indentation from each line
        return str
            .split('\n')
            .map((line) => line.slice(indent))
            .join('\n');
    }

    function escapeHtml(str: string) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderContent(content: string) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
    }
</script>

{#snippet code(str: string, lang: string)}
    <pre><code>{@html hljs.highlight(formatCode(str), { language: lang }).value}</code></pre>
{/snippet}

<div
    class={[
        'relative grid h-full w-full grid-cols-1 place-content-center bg-[#0a0a0a] px-3 text-[#ededed]',
        cursorHidden ? 'cursor-none' : ''
    ]}
>
    <div class="absolute right-10 bottom-10">
        {activeIndex + 1}/{slides.length}
        <p class="sr-only">
            slide {activeIndex + 1} of {slides.length}
        </p>
    </div>
    {#each slides as slide, i (i)}
        {@const visible = activeIndex === i}
        {#if visible}
            <article
                class="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6 text-center [&_code]:rounded-md [&_code]:bg-neutral-900 [&_code]:px-1 [&_code]:text-neutral-400"
                style="grid-area: 1/1"
                in:fly={{ duration: 300, easing: cubicOut, y: 20, delay: 200 }}
                out:fly={{ duration: 300, easing: cubicOut, y: -20 }}
            >
                {#if slide.title}
                    <h1 class="text-5xl font-semibold">
                        {slide.title}
                    </h1>
                {/if}
                {#if slide.content}
                    {#if Array.isArray(slide.content)}
                        <div class="space-y-1">
                            {#each slide.content as content}
                                <div class="text-xl">
                                    {@html renderContent(content)}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-xl">
                            {@html renderContent(slide.content)}
                        </div>
                    {/if}
                {/if}
                {#if slide.code}
                    <div class="w-full rounded-xl bg-neutral-900 p-4 text-start transition-colors">
                        {@render code(slide.code, slide.lang || 'html')}
                    </div>
                {/if}
                {#if slide.ul}
                    <ul class="list-inside list-disc space-y-1 text-start text-xl">
                        {#each slide.ul as item}
                            <li>{@html renderContent(item)}</li>
                        {/each}
                    </ul>
                {/if}
                {#if slide.ol}
                    <ol class="list-inside list-decimal space-y-1 text-start text-xl">
                        {#each slide.ol as item}
                            <li>{@html renderContent(item)}</li>
                        {/each}
                    </ol>
                {/if}
                {#if slide.image}
                    <img
                        class="w-full rounded-xl object-contain"
                        src={slide.image}
                        alt={slide.title}
                    />
                {/if}
            </article>
        {/if}
    {/each}
</div>
