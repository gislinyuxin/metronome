<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { MetronomeController } from '@/core/metronome';
const isPlaying = ref(false);
const metronome = ref(new MetronomeController())
const masterVolume = ref(100)
const tempo = ref(80)
const _delta = ref(0)
const beatStyles = ref(new Array(16).fill('bg-neutral-100'));
const noteResolution = ref(2);
const noteResolutions = ref([
    { text: '1/4', value: 2 },
    { text: '1/8', value: 1 },
    { text: '1/16', value: 0 },
]);

const handlePlayBtnClick = () => {
    isPlaying.value = !isPlaying.value
    metronome.value.play()
}

const handleTapBtnClick = () => {
    stop()
    const d = new Date();
    const temp = d.getTime();
    let tapBpm = Math.ceil(60000 / (temp - _delta.value));
    _delta.value = temp;
    if (tapBpm > 400) {
        tapBpm = 400;
    }
    metronome.value.setTemp(tapBpm)
    tempo.value = tapBpm;
}

const stop = () => {
    isPlaying.value = false
    metronome.value.stop()
}

const handleTempoInputChange = ($event: Event) => {
    handleTempoChange(parseInt(($event.target as HTMLInputElement).value))
}

const handleTempoChange = (value: number) => {
    metronome.value.setTemp(value)
    tempo.value = value;
    stop()
}

const handleMasterVolumeChange = ($event: Event) => {
    masterVolume.value = Number(($event.target as HTMLInputElement).value)
    metronome.value.setMasterVolume(masterVolume.value / 100)
}

const handleNoteResolutionSelect = (value: number) => {
    noteResolution.value = value
    metronome.value.setNoteResolution(value);
    stop()
}

onMounted(() => {
    metronome.value.initTimerWorker(new URL("@/core/metronome.worker.ts", import.meta.url))
    metronome.value.setTemp(tempo.value)
    metronome.value.setNoteResolution(noteResolution.value)
})

watch(() => metronome.value.beatStyles, (value) => {
    const fillStyleClassMap: { [key: string]: string } = {
        red: 'bg-amber-300',
        blue: 'bg-amber-100',
        black: 'bg-neutral-100',
    }
    beatStyles.value = value.map(style => fillStyleClassMap[style])
})

</script>

<template>
    <div class="flex justify-center w-screen p-4">
        <div class="rounded overflow-hidden shadow-lg w-full p-4 mt-6 flex flex-col gap-4">
            <div class="flex justify-center items-center">
                <div class="flex-1 grid grid-cols-16 gap-1">
                    <span class="h-24 rounded gap-2" :class="item" :key="item + i"
                        v-for="(item, i) of beatStyles"></span>
                </div>
            </div>

            <div class="flex justify-center min-h-30">
                <button type="button" class="cursor-pointer w-14 bg-blue-100 hover:bg-blue-200 rounded-l"
                    @click="handleTempoChange(tempo - 1)">-</button>
                <input class="flex-1 text-6xl min-w-0 outline-none font-bold text-center bg-neutral-100" type="number"
                    :value="tempo" @change="handleTempoInputChange">
                <button type="button" class="cursor-pointer w-14 bg-blue-100 hover:bg-blue-200 rounded-r"
                    @click="handleTempoChange(tempo + 1)">+</button>
            </div>

            <div class="flex justify-center items-center">
                <div class="pr-2 min-w-20">BPM</div>
                <input type="range" class="flex-1" name="volume" min="20" max="300" :value="tempo"
                    @change="handleTempoInputChange" />
                <div class="pl-2">{{ tempo }}</div>
            </div>

            <div class="flex justify-center items-center">
                <div class="pr-2 min-w-20">Volume</div>
                <input type="range" class="flex-1" name="volume" min="0" max="100" :value="masterVolume"
                    @change="handleMasterVolumeChange" />
                <div class="pl-2">{{ masterVolume }}</div>
            </div>

            <div class="flex justify-center items-center">
                <div class="pr-2 min-w-20">Beats</div>
                <div class="flex-1 grid grid-cols-3 gap-1">
                    <span v-for="item of noteResolutions" :key="item.text"
                        @click="handleNoteResolutionSelect(item.value)"
                        :class="{ 'bg-blue-200': item.value === noteResolution }"
                        class="cursor-pointer p-2 text-center rounded border border-blue-100 hover:bg-blue-100">
                        {{ item.text }}
                    </span>
                </div>
            </div>

            <button class="cursor-pointer h-20 bg-gray-100 hover:bg-gray-200 font-bold py-2 px-4 rounded" type="button"
                @click="handleTapBtnClick"> TAP </button>

            <button class="cursor-pointer h-20 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                type="button" @click="handlePlayBtnClick"> {{ isPlaying ? 'Pause' : 'Play' }}</button>
        </div>

    </div>
</template>

<style scoped></style>