<script lang="ts" module>
    export interface Slide {
        title?: string;
        content?: string;
        code?: string;
        lang?: string;
        image?: string;
    }
</script>

<script lang="ts">
    import { cubicOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/rose-pine.css';

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
</script>

{#snippet code(str: string, lang: string)}
    <pre><code>{@html hljs.highlight(formatCode(str), { language: lang }).value}</code></pre>
{/snippet}

<div
    class={[
        'relative grid h-full w-full grid-cols-1 place-content-center px-3',
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
                class="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 text-center"
                style="grid-area: 1/1"
                in:fly={{ duration: 300, easing: cubicOut, y: 20, delay: 200 }}
                out:fly={{ duration: 300, easing: cubicOut, y: -20 }}
            >
                {#if slide.title}
                    <h1 class="text-5xl">
                        {slide.title}
                    </h1>
                {/if}
                {#if slide.content}
                    <p class="text-xl">
                        {slide.content}
                    </p>
                {/if}
                {#if slide.code}
                    <div class="w-full rounded-xl bg-neutral-950 p-4 text-start transition-colors">
                        {@render code(slide.code, slide.lang || 'html')}
                    </div>
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
