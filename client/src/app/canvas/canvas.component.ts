import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.scss']
})

export class CanvasComponent implements AfterViewInit {

    testdata
    cx: CanvasRenderingContext2D
    @ViewChild("canvas") public canvas: ElementRef

    @Input() public width = 800
    @Input() public height = 800

    public ngAfterViewInit() {
        const canvasElem: HTMLCanvasElement = this.canvas.nativeElement;

        canvasElem.width = this.width;
        canvasElem.height = this.height;

        this.captureEvents(canvasElem)
    }

    constructor(public dialogRef: MatDialogRef<CanvasComponent>) { }

    /**
     * Closes Dialog and returns the Image
     */
    closeDialog() {
        this.dialogRef.close(this.testdata);
    }

    /**
     * Converts canvas to Image
    */
    convert() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        var image = new Image();
        image.src = canvasEl.toDataURL("image/png");
        image.id = "canvas_" + Math.floor((Math.random() * 10000000) + 1).toString() + ".png"

        this.testdata = image
    }

    /**
     * closes the dialog 
     */
    onNoClick(): void {
        this.dialogRef.close();
    }

    /**
     * uses mouse events to draw on canvas
     * on mouseup converts to image
     * 
     * @param canvasElem 
     */
    captureEvents(canvasElem: HTMLCanvasElement) {

        let draw = false
        let self = this
        let ctx = canvasElem.getContext('2d');
        const rect = canvasElem.getBoundingClientRect()
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "#001"
        ctx.fillStyle = "#FFFFFF"

        canvasElem.onmouseenter = (e1) => {
            ctx.moveTo(e1.clientX - rect.left, e1.clientY - rect.top)
        }

        canvasElem.onmouseleave = () => {
            draw = false
        }

        canvasElem.onmouseup = (e1) => {
            self.convert()

            draw = false
            ctx.moveTo(e1.clientX - rect.left, e1.clientY - rect.top)
        }

        canvasElem.onmousedown = (e1) => {
            draw = true
            ctx.moveTo(e1.clientX - rect.left, e1.clientY - rect.top)

            canvasElem.onmousemove = (e) => {

                if (draw) {
                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    ctx.stroke();
                }
            }
        }
    }
}
