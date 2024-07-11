import { engine } from '../engine/index.js';

engine({
	width: 640,
	height: 480,
	root: {
		children: {
			bg: {
				box: { x: 0, y: 0, w: 640, h: 480 },
				image: {
					src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAwIDgwMCI+PHBhdGggZmlsbD0iI2ZhMCIgZD0iTTAgMGgxNjAwdjgwMEgweiIvPjxwYXRoIGZpbGw9IiNmZmIxMDAiIGQ9Ik00ODYgNzA2Yy0xMDktMjItMjIzLTMyLTMzNS0yMC01MSA2LTEwMiAxNy0xNTEgMzR2ODBoODQ0Yy0xMTYtMzMtMjMxLTY4LTM0OC05MmwtMTAtMnoiLz48cGF0aCBmaWxsPSIjZmZiODAwIiBkPSJNMTYwMCAwSDB2NzIwYzQ5LTE3IDEwMC0yOCAxNTEtMzQgMTEyLTEyIDIyNi0yIDMzNSAyMGwxMCAyYzExNyAyNCAyMzIgNTkgMzQ4IDkyaDc1NlYweiIvPjxwYXRoIGZpbGw9IiNmZmJlMDAiIGQ9Ik00NzggNTgxbDEwIDNjMTk2IDUyIDM4OSAxMzMgNTkzIDE3NiAxNzUgMzcgMzUwIDI5IDUxOS0xMFYwSDB2NTc1YzUyLTE4IDEwNy0yOCAxNjEtMzEgMTA3LTcgMjE1IDEwIDMxNyAzN3oiLz48cGF0aCBmaWxsPSIjZmZjNTAwIiBkPSJNMCAwdjQyOWM1Ni0xOCAxMTQtMjcgMTcxLTI3IDEwMy0xIDIwNCAyMiAzMDAgNTRsOSAzYzE4MyA2MiAzNjUgMTQ2IDU2MiAxOTIgMTg3IDQ0IDM3NiAzNSA1NTgtMTJWMEgweiIvPjxwYXRoIGZpbGw9IiNmYzAiIGQ9Ik0xODIgMjU5Yzk4IDYgMTkyIDM2IDI4MSA3Mmw4IDRjMTcxIDcxIDM0MyAxNTggNTMyIDIwOCAxOTkgNTEgNDAzIDQwIDU5Ny0xNVYwSDB2MjgzYzU5LTE5IDEyMS0yNyAxODItMjR6Ii8+PHBhdGggZmlsbD0iI2ZmZDkxNCIgZD0iTTE2MDAgMEgwdjEzNmM2Mi0yMSAxMjgtMjcgMTkyLTE5IDk0IDEyIDE4MSA0OCAyNjQgOTBsNyA0YzE1OSA4MSAzMjAgMTcxIDUwMSAyMjMgMjEwIDYxIDQzMCA0OSA2MzYtMTdWMHoiLz48cGF0aCBmaWxsPSIjZmZlNTI5IiBkPSJNNDU1IDg2YzE0NiA5MSAyOTcgMTgzIDQ2OSAyMzlhMTA0MSAxMDQxIDAgMDA2NzYtMThWMEgyODhjNTYgMjEgMTA5IDUxIDE2MCA4Mmw3IDR6Ii8+PHBhdGggZmlsbD0iI2ZmZWYzZCIgZD0iTTE2MDAgMEg0OThjMTE4IDg2IDI0NCAxNjUgMzg3IDIxNmE5ODUgOTg1IDAgMDA3MTUtMjBWMHoiLz48cGF0aCBmaWxsPSIjZmZmODUyIiBkPSJNMTM5OCAxNTVhODYxIDg2MSAwIDAwMjAyLTczVjBINjQzYzYzIDQyIDEzMCA3OCAyMDIgMTA3IDE3NSA3MSAzNjkgODkgNTUzIDQ4eiIvPjxwYXRoIGZpbGw9IiNmZjYiIGQ9Ik0xMzE1IDcyYzc2LTEyIDE0OS0zNyAyMTctNzJIODA5YTg4NyA4ODcgMCAwMDUwNiA3MnoiLz48L3N2Zz4=',
				},
			},
			hours: {
				box: {
					x: 320,
					y: 240,
					cx: 10,
					cy: 210,
					sy: -1,
					w: 20,
					h: 240,
				},
				image: {
					src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAADwCAMAAAA3grSrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAAAAAApWe5zwAAAAJ0Uk5T/wDltzBKAAAAPElEQVR42uzXoRHAIADAwHT/pZEgiutVwEf+Bul5KQgh/ATrH6ypEEII78BaFEII4RVYq56ALhJucAgwAIIjD43QJRo/AAAAAElFTkSuQmCC',
				},
			},
			minutes: {
				box: {
					x: 320,
					y: 240,
					cx: 10,
					cy: 220,
					//sy: -1,
					w: 20,
					h: 240,
				},
				image: {
					src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAADwCAMAAAA3grSrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAAAAAApWe5zwAAAAJ0Uk5T/wDltzBKAAAAPUlEQVR42uzYoQHAIADAsPL/05NDMMMEglTmhDYWtYEFIYSnsF6FEEJ4B9akEEIIr8CaFR7G/ysJfuMjwAA3rg7hWWtNkAAAAABJRU5ErkJggg==',
				},
			},
			seconds: {
				box: {
					x: 320,
					y: 240,
					cy: 4,
					cx: 10,
					w: 20,
					h: 240,
				},
				image: {
					src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAADwCAMAAAA3grSrAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF/wAAAAAAQaMSAwAAAAJ0Uk5T/wDltzBKAAAAUklEQVR42uzYMQoAIAxD0fT+lxbEoUJwaEFEfsY3BZqpChMVUAJBEARBEARBEATBv1AzO0pZtdnSy2gr+fKcGDyj3VIT/RQfxEhWwe5vLWUIMABZGRBta6PNxwAAAABJRU5ErkJggg==',
				},
			},
			linex: {
				box: {
					x: 0,
					y: 240,
					w: 640,
					h: 1,
				},
				fill: [0, 0, 0, 255],
			},
			liney: {
				box: {
					x: 320,
					y: 0,
					w: 1,
					h: 480,
				},
				fill: [0, 0, 0, 255],
			},
		},
		update(node) {
			const PI = Math.PI;
			const t = new Date(),
				_secs = t.getSeconds() + t.getMilliseconds() / 1000,
				_mins = t.getMinutes() + _secs / 60,
				_hours = t.getHours() + _mins / 60;
			node.children!.hours.box!.rotation = PI + (PI / 6) * _hours;
			node.children!.minutes.box!.rotation = PI + (PI / 30) * _mins;
			node.children!.seconds.box!.rotation = PI + (PI / 30) * _secs;
		},
	},
});
