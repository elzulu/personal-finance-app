/**
 * Tests unitarios — lib/fechasPago.ts
 */
import { describe, it, expect } from "vitest";
import {
  aDia,
  diasEnMes,
  diffDias,
  estadoPago,
  fechaDePago,
  formatDia,
  hoyEnZona,
  prioridadPago,
  sumarDias,
  vencimientoAnterior,
  vencimientoProximo,
  type Dia,
} from "@/lib/fechasPago";

const dia = (y: number, m: number, d: number): Dia => ({ y, m, d });

describe("fechaDePago / diasEnMes", () => {
  it("usa el día pedido cuando el mes lo tiene", () => {
    expect(fechaDePago(2026, 10, 15)).toEqual(dia(2026, 10, 15));
  });

  it("recorta al último día en meses cortos", () => {
    expect(fechaDePago(2026, 2, 31)).toEqual(dia(2026, 2, 28));
    expect(fechaDePago(2028, 2, 31)).toEqual(dia(2028, 2, 29)); // bisiesto
    expect(fechaDePago(2026, 4, 31)).toEqual(dia(2026, 4, 30));
  });

  it("diasEnMes", () => {
    expect(diasEnMes(2026, 2)).toBe(28);
    expect(diasEnMes(2028, 2)).toBe(29);
    expect(diasEnMes(2026, 12)).toBe(31);
  });
});

describe("diffDias / sumarDias", () => {
  it("cuenta días entre fechas", () => {
    expect(diffDias(dia(2026, 10, 3), dia(2026, 10, 5))).toBe(2);
    expect(diffDias(dia(2026, 10, 5), dia(2026, 10, 3))).toBe(-2);
    expect(diffDias(dia(2026, 12, 30), dia(2027, 1, 2))).toBe(3);
  });

  it("suma días cruzando mes y año", () => {
    expect(sumarDias(dia(2026, 12, 31), 1)).toEqual(dia(2027, 1, 1));
    expect(sumarDias(dia(2026, 3, 1), -1)).toEqual(dia(2026, 2, 28));
  });
});

describe("hoyEnZona (Colombia, UTC−5)", () => {
  it("a las 22:00 en Bogotá todavía es el mismo día (aunque en UTC ya sea el siguiente)", () => {
    expect(hoyEnZona(new Date("2026-10-05T03:00:00Z"))).toEqual(dia(2026, 10, 4));
  });

  it("a la 01:00 en Bogotá ya es el día nuevo", () => {
    expect(hoyEnZona(new Date("2026-10-05T06:00:00Z"))).toEqual(dia(2026, 10, 5));
  });
});

describe("aDia", () => {
  it("lee fechas ISO sin correr el día", () => {
    expect(aDia("2026-10-04T00:00:00.000Z")).toEqual(dia(2026, 10, 4));
    expect(aDia("2026-10-04")).toEqual(dia(2026, 10, 4));
  });

  it("lee objetos Date en UTC", () => {
    expect(aDia(new Date("2026-10-04T00:00:00Z"))).toEqual(dia(2026, 10, 4));
  });
});

describe("vencimientoAnterior / vencimientoProximo", () => {
  it("anterior: del mes pasado si el día aún no llega", () => {
    expect(vencimientoAnterior(5, dia(2026, 10, 3))).toEqual(dia(2026, 9, 5));
  });

  it("anterior: hoy si hoy es el día", () => {
    expect(vencimientoAnterior(5, dia(2026, 10, 5))).toEqual(dia(2026, 10, 5));
  });

  it("anterior: respeta meses cortos", () => {
    expect(vencimientoAnterior(31, dia(2026, 3, 1))).toEqual(dia(2026, 2, 28));
  });

  it("anterior: cruza el año", () => {
    expect(vencimientoAnterior(20, dia(2027, 1, 3))).toEqual(dia(2026, 12, 20));
  });

  it("próximo: este mes si falta, hoy si coincide", () => {
    expect(vencimientoProximo(5, dia(2026, 10, 3))).toEqual(dia(2026, 10, 5));
    expect(vencimientoProximo(5, dia(2026, 10, 5))).toEqual(dia(2026, 10, 5));
  });

  it("próximo estricto: salta al mes siguiente si hoy es el día", () => {
    expect(vencimientoProximo(5, dia(2026, 10, 5), true)).toEqual(dia(2026, 11, 5));
  });

  it("próximo: cruza el año y recorta meses cortos", () => {
    expect(vencimientoProximo(15, dia(2026, 12, 20))).toEqual(dia(2027, 1, 15));
    expect(vencimientoProximo(31, dia(2026, 1, 31), true)).toEqual(dia(2026, 2, 28));
  });
});

describe("estadoPago", () => {
  const hoy = dia(2026, 10, 10);
  const vieja = dia(2026, 1, 1);

  it("sin día de pago o deuda saldada → sin_fecha", () => {
    expect(estadoPago({ diaPago: null, hoy }).tipo).toBe("sin_fecha");
    expect(estadoPago({ diaPago: undefined, hoy }).tipo).toBe("sin_fecha");
    expect(estadoPago({ diaPago: 15, hoy, saldada: true }).tipo).toBe("sin_fecha");
  });

  it("vence hoy cuando coincide el día y no hay pago", () => {
    const e = estadoPago({ diaPago: 10, hoy, creada: vieja });
    expect(e.tipo).toBe("hoy");
    expect(e.etiqueta).toBe("Vence hoy");
  });

  it("próximo (deuda reciente): mañana y en N días", () => {
    const creada = dia(2026, 10, 9);
    expect(estadoPago({ diaPago: 11, hoy, creada }).etiqueta).toBe("Vence mañana");
    const e = estadoPago({ diaPago: 15, hoy, creada });
    expect(e.tipo).toBe("proximo");
    expect(e.dias).toBe(5);
    expect(e.etiqueta).toBe("Vence en 5 días");
  });

  it("próximo: el pago del mes pasado (hecho con un día de retraso) no cubre el que viene", () => {
    const e = estadoPago({ diaPago: 11, hoy, creada: vieja, ultimoPago: dia(2026, 9, 12) });
    expect(e.tipo).toBe("proximo");
    expect(e.etiqueta).toBe("Vence mañana");
  });

  it("próximo: pagó este mes tras el vencimiento; faltan días para el siguiente", () => {
    const e = estadoPago({ diaPago: 5, hoy, creada: vieja, ultimoPago: dia(2026, 10, 7) });
    expect(e.tipo).toBe("proximo");
    expect(e.dias).toBe(26);
  });

  it("vencida: pasó el día del mes y no hay pago de ese mes", () => {
    const e = estadoPago({ diaPago: 5, hoy, creada: vieja, ultimoPago: dia(2026, 9, 3) });
    expect(e.tipo).toBe("vencida");
    expect(e.dias).toBe(5);
    expect(e.etiqueta).toBe("Venció hace 5 días");
  });

  it("vencida en singular", () => {
    expect(estadoPago({ diaPago: 9, hoy, creada: vieja }).etiqueta).toBe("Venció hace 1 día");
  });

  it("un pago muy anterior no cubre el vencimiento", () => {
    const e = estadoPago({ diaPago: 5, hoy, creada: vieja, ultimoPago: dia(2026, 8, 20) });
    expect(e.tipo).toBe("vencida");
  });

  it("pagada: pago adelantado del próximo vencimiento", () => {
    const e = estadoPago({ diaPago: 5, hoy: dia(2026, 10, 4), creada: vieja, ultimoPago: dia(2026, 10, 2) });
    expect(e.tipo).toBe("pagada");
    expect(e.vencimiento).toEqual(dia(2026, 11, 5));
    expect(e.etiqueta).toBe("Pagada · próximo pago el 5 de nov");
  });

  it("pagada: pagó el mismo día del vencimiento", () => {
    const e = estadoPago({ diaPago: 10, hoy, creada: vieja, ultimoPago: dia(2026, 10, 10) });
    expect(e.tipo).toBe("pagada");
    expect(e.dias).toBe(31); // próximo: 10 de nov
  });

  it("pagar un día antes del vencimiento cuenta para ese vencimiento", () => {
    const e = estadoPago({ diaPago: 10, hoy, creada: vieja, ultimoPago: dia(2026, 10, 9) });
    expect(e.tipo).toBe("pagada");
  });

  it("deuda creada después del último vencimiento no figura como vencida", () => {
    const e = estadoPago({ diaPago: 5, hoy, creada: dia(2026, 10, 8) });
    expect(e.tipo).toBe("proximo");
    expect(e.vencimiento).toEqual(dia(2026, 11, 5));
  });

  it("día 31 en mes corto vence el último día del mes", () => {
    const e = estadoPago({ diaPago: 31, hoy: dia(2026, 2, 28), creada: vieja, ultimoPago: dia(2026, 1, 31) });
    expect(e.tipo).toBe("hoy"); // el pago de enero no cubre el vencimiento del 28 de febrero
  });
});

describe("prioridadPago", () => {
  const hoy = dia(2026, 10, 10);
  const creada = dia(2026, 1, 1);

  it("ordena: vencidas (más antiguas primero), hoy, próximas por cercanía, resto al final", () => {
    const venc5 = estadoPago({ diaPago: 5, hoy, creada });
    const venc9 = estadoPago({ diaPago: 9, hoy, creada });
    const haceHoy = estadoPago({ diaPago: 10, hoy, creada });
    const en3 = estadoPago({ diaPago: 13, hoy, creada: dia(2026, 10, 9) });
    const en8 = estadoPago({ diaPago: 18, hoy, creada: dia(2026, 10, 9) });
    const sin = estadoPago({ diaPago: null, hoy });

    const orden = [sin, en8, haceHoy, venc9, en3, venc5].sort((a, b) => prioridadPago(a) - prioridadPago(b));
    expect(orden).toEqual([venc5, venc9, haceHoy, en3, en8, sin]);
  });
});

describe("formatDia", () => {
  it("formatea día y mes abreviado", () => {
    expect(formatDia(dia(2026, 11, 5))).toBe("5 de nov");
  });
});
