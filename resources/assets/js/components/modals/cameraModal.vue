<template>
    <div class="modal fade" id="camera-modal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div id="cameraWindow"></div>
                <div class="modal-footer">
                    <h4>{{ targetText }}を近づけて下さい</h4>
                    <input type="checkbox" v-model="isConfirm"> 確認する
                    <input type="checkbox" v-model="isDetection"> 画像から検索
                    <div v-if="isDetection">
                        <button class="btn" @click="capture">撮影</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Quagga from 'quagga';
import { Books } from '../../books/';

export default {
    data: () => ({
        qgParams: {
            inputStream: {
                name: 'Live',
                type: 'LiveStream',
                target: '#cameraWindow',
                singleChannel: false,
            },
            locator: {
                patchSize: 'medium',
                halfSample: true,
            },
            decoder: {
                readers: [ 'ean_reader' ],
            },
            locate: true,
        },
        interval: null,
        isConfirm: true,
        isDetection: false,
        detectedCodes: [],
    }),
    methods: {
        open() {
            $('#camera-modal').modal('show');
            this.start();
        },
        start() {
            Quagga.init(this.qgParams, el => {
                if (el) return;

                Quagga.start();
                Quagga.onProcessed(r => this.processed(r));
                Quagga.onDetected(r => this.detected(r));

                this.interval = setInterval(() => {
                    if (!$('#camera-modal').hasClass('in')) {
                        Quagga.stop();
                    }
                }, 100);
            });
        },
        capture() {
            const video = document.querySelector('video');
            const canvas = document.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            const controller = new AbortController();

            ctx.drawImage(video, 0, 0, video.offsetWidth, video.offsetHeight);
            canvas.toBlob(blob => {
                this.$parent.$refs.loading.show('識別中・・・', controller);

                Books.detection(blob, controller).then(obj => {
                    const title = obj.result[0].match(/([^[\]]+)/)[1].trim();

                    this.$parent.beforeCreate(r => {
                        this.$parent.create(r);
                    }, 'title', title);
                });

                Quagga.stop();
                this.hide();
            });
        },
        processed(result) {
            if (!result) return;

            const ctx = Quagga.canvas.ctx.overlay;
            const canvas = Quagga.canvas.dom.overlay;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!this.isDetection && result.boxes) {
                const hasNotRead = box => box !== result.box;
                result.boxes.filter(hasNotRead).forEach(box => {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, ctx, { color: 'green', lineWidth: 2 });
                });
            }

            if (result.codeResult && result.codeResult.code && this.validation(result.codeResult.code)) {
                Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, ctx, { color: 'blue', lineWidth: 2 });
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, ctx, {color: 'red', lineWidth: 3});
            }
        },
        detected(result) {
            const isbn = result.codeResult.code;
            if (!this.isDetection && this.validation(isbn)) {
                if (this.isConfirm) {
                    Quagga.stop();
                }

                this.create(isbn);
                this.detectedCodes.push(isbn);
            }
        },
        create(code) {
            if (this.detectedCodes.indexOf(code) < 0) {
                if (this.isConfirm) {
                    this.hide();
                }

                this.$parent.beforeCreate(r => {
                    this.$parent.create(r);
                }, 'code', code, !this.isConfirm);
            }
        },
        validation(code) {
            return code.match(/^978/);
        },
        hide() {
            $('#camera-modal').modal('hide');
            $('#app-navbar-collapse').collapse('toggle');
            clearInterval(this.interval);
        },
    },
    computed: {
        targetText() {
            return this.isDetection ? '表紙': 'バーコード';
        },
    },
};
</script>
