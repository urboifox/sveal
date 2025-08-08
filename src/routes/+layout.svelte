<script lang="ts">
    import '../app.css';
    import '@fontsource/poppins';

    let { children } = $props();

    $effect(() => {
        const controller = new AbortController();
        addEventListener(
            'keydown',
            (event) => {
                if (event.key === 'f') {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                        return;
                    }
                    document.documentElement.requestFullscreen();
                }
            },
            { signal: controller.signal }
        );

        return () => {
            controller.abort();
        };
    });
</script>

<svelte:head>
    <title>Sveal</title>
</svelte:head>

<div class="h-screen bg-black text-white">
    {@render children()}
</div>
