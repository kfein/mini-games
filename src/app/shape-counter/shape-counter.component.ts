import { Component, ViewChild, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { GameService } from '../game.service';
import { Game } from '../game';
import { Shape } from './ShapeCounter';
import { CountdownComponent } from '../countdown/countdown.component';
import { KeyboardManager } from "../KeyboardManager";
import { Buzzer } from "../buzzer";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-shape-counter',
  templateUrl: './shape-counter.component.html',
  styleUrls: ['./shape-counter.component.css']
})
export class ShapeCounterComponent implements AfterViewInit, OnDestroy {
  @ViewChild("shapeCounterCanvas") canvas: ElementRef;

  private gameStarted: boolean = false;
  private shapes: any[] = [];
  private width: number;
  private height: number;
  private interval: any;
  private context: CanvasRenderingContext2D;
  private maxShapes: number;
  private currShapeIndex: number = 0;
  private isCountingEnabled: boolean = false;
  private wantedShapeType: number;
  private wantedShapeColor: number;

  private buzzer1: Buzzer;
  private buzzer2: Buzzer;
  private keyDownSub: Subscription;
  private keyUpSub: Subscription;

  private player1Counter: number = 0;
  private player2Counter: number = 0;

  private game: Game = new Game("ShapeCounter", 3, 0);

  @ViewChild('countdown') countdown: CountdownComponent;
  @ViewChild('startCountdown') startCountdown: CountdownComponent;

  constructor(public gameService: GameService, private keyboardManager: KeyboardManager) {
    this.buzzer1 = new Buzzer();
    this.buzzer2 = new Buzzer();

    this.keyDownSub = keyboardManager.keyDown.subscribe(bzrs => {
      this.buzzer1 = bzrs[0];
      this.buzzer2 = bzrs[1];

      if (!this.gameStarted && (this.buzzer1.red || this.buzzer2.red)) {
        this.start();
      }

      if (this.buzzer1.red && this.isCountingEnabled) {
        this.player1Counter++;
      }
      if (this.buzzer2.red && this.isCountingEnabled) {
        this.player2Counter++;
      }
    });

    this.keyUpSub = keyboardManager.keyUp.subscribe(bzrs => {
      this.buzzer1 = bzrs[0];
      this.buzzer2 = bzrs[1];
    });

    this.gameService.loadGame(this.game);
  }

  ngAfterViewInit() {
    this.width = 500;
    this.height = 500;

    let canvas = this.canvas.nativeElement;
    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;
    this.context = canvas.getContext("2d");

    this.maxShapes = 60;
    this.shapes = [];

    this.tick();
  }

  start(): void {
    this.gameStarted = true;
    this.wantedShapeType = Math.floor(Math.random() * 2 + 1);
    this.wantedShapeColor = Math.floor(Math.random() * 3);
    this.startCountdown.startTimer(5);
  }

  newGame(): void {
    this.shapes = [];
    this.currShapeIndex = 0;
    this.player1Counter = 0;
    this.player2Counter = 0;

    this.interval = setInterval(() => {
      if (this.currShapeIndex < this.maxShapes) {
        let type = Math.floor(Math.random() * 2 + 1);
        let color = Math.floor(Math.random() * 3);
        let speedFactor = 7;

        let shape = new Shape(this.context, this.width, this.height, this.shapes.length, type, color, speedFactor);
        this.shapes.push(shape);

        if(this.wantedShapeType == type && this.wantedShapeColor == color)
          console.log("JETZT");

        this.currShapeIndex++;
      }
      else {
        clearInterval(this.interval);
        this.startCounting();
      }
    }, 500);
  }

  startCounting(): void {
    this.isCountingEnabled = true;

    this.countdown.startTimer(10);
  }

  onCountdownEnded(): void {
    this.isCountingEnabled = false;
    let wantedShapes = this.shapes.filter((shape: Shape) => shape.particleType == this.wantedShapeType && shape.particleColor == this.wantedShapeColor);

    if (this.player1Counter === wantedShapes.length)
      this.gameService.addPlayer1Point();
    else
      this.gameService.reducePlayer1Point();

    if (this.player2Counter === wantedShapes.length)
      this.gameService.addPlayer2Point();
    else
      this.gameService.reducePlayer2Point();

    this.wantedShapeType = Math.floor(Math.random() * 2 + 1);
    this.wantedShapeColor = Math.floor(Math.random() * 3);

    this.newGame();
  }

  onStartCountdownEnded(): void {
    this.newGame();
  }

  tick(): void {
    requestAnimationFrame(() => {
      this.tick()
    });
    this.context.clearRect(0, 0, this.width, this.height);
    this.draw();
  }

  draw(): void {
    for (let key in this.shapes) {
      this.shapes[key].update();
      this.shapes[key].draw();
    }
  }

  getWantedShapeText(): string {
    let text = '';
    text += this.wantedShapeColor == 0 ? 'roten ' : this.wantedShapeColor == 1 ? 'grünen ' : 'blauen ';
    text += this.wantedShapeType == 1 ? 'Kreise' : 'Quadrate';
    return text;
  }

  ngOnDestroy(): void {
    this.keyDownSub.unsubscribe();
    this.keyUpSub.unsubscribe();
  }
}
