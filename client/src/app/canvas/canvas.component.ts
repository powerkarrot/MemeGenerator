import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fromEvent } from "rxjs";
import { switchMap, takeUntil, pairwise } from "rxjs/operators";

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.scss']
})

export class CanvasComponent implements AfterViewInit {

    testdata 

    @ViewChild("canvas") public canvas: ElementRef;

    @Input() public width = 400;
    @Input() public height = 400;

    private cx: CanvasRenderingContext2D;

    public ngAfterViewInit() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext("2d");

        canvasEl.width = this.width;
        canvasEl.height = this.height;

        this.cx.lineWidth = 3;
        this.cx.lineCap = "round";
        this.cx.strokeStyle = "#001";
        this.cx.fillStyle = "#FFFFFF"
       
        this.captureEvents(canvasEl);
    }


    constructor(public dialogRef: MatDialogRef<CanvasComponent>) {}

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
        image.id = "canvas_" + Math.floor((Math.random()*10000000)+1).toString() + ".png"

        this.testdata = image
    }


    onNoClick(): void {
        this.dialogRef.close();
    }

    /**
     * Captures mouse events on canvas 
     * Adapted from tutorial:
     * https://medium.com/@tarik.nzl/creating-a-canvas-component-with-free-hand-drawing-with-rxjs-and-angular-61279f577415
     * 
     * @param canvasEl 
     */
    private captureEvents(canvasEl: HTMLCanvasElement) {
        
        fromEvent(canvasEl, "mousedown")
            .pipe(
                switchMap(e => {
                    return fromEvent(canvasEl, "mousemove").pipe(
                        takeUntil(fromEvent(canvasEl, "mouseup")),
                        takeUntil(fromEvent(canvasEl, "mouseleave")),
                        pairwise()
                    );
                })
            )
            .subscribe((res: [MouseEvent, MouseEvent]) => {
                const rect = canvasEl.getBoundingClientRect();
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };

                this.drawOnCanvas(prevPos, currentPos);
            });
    }


    /**
     * Draws points from mouse event in canvas 
     * converts Canvas to Image
     * 
     * @param prevPos 
     * @param currentPos 
     * @returns 
     */
    private drawOnCanvas(
        prevPos: { x: number; y: number },
        currentPos: { x: number; y: number }) {
        if (!this.cx) {
            return;
        }

        this.cx.beginPath();

        if (prevPos) {
            this.cx.moveTo(prevPos.x, prevPos.y); 
            this.cx.lineTo(currentPos.x, currentPos.y);
            this.cx.stroke();
        }

        this.convert()
    }
}
