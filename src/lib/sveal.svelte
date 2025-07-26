<script lang="ts" module>
    export interface Slide {
        title?: string;
        content?: string;
        code?: string;
        lang?: string;
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
</script>

{#snippet code(str: string, lang: string)}
    <pre><code>{@html hljs.highlight(str, { language: lang }).value}</code></pre>
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
            </article>
        {/if}
    {/each}
</div>
