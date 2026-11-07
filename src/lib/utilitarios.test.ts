import { describe, expect, it } from 'vitest';
import {
  antesDoHorario,
  dataAmigavel,
  diasEntre,
  ehDataISO,
  hojeEmPelotas,
  partesEmPelotas,
  somarDias,
} from './datas';
import { formatarReais, lerReais } from './dinheiro';
import { formatarWhatsapp, linkWhatsapp, normalizarWhatsapp, whatsappValido } from './whatsapp';

describe('datas no fuso de Pelotas', () => {
  it('usa o dia de Pelotas, não o do servidor em UTC', () => {
    // 23:30 em Pelotas do dia 7 = 02:30 UTC do dia 8.
    const instante = new Date('2026-11-08T02:30:00Z');
    expect(partesEmPelotas(instante)).toEqual({ data: '2026-11-07', hora: '23:30' });
    expect(hojeEmPelotas(instante)).toBe('2026-11-07');
  });

  it('meia-noite em Pelotas já é o dia seguinte', () => {
    expect(partesEmPelotas(new Date('2026-11-08T03:00:00Z'))).toEqual({ data: '2026-11-08', hora: '00:00' });
  });

  it('soma dias atravessando mês e ano', () => {
    expect(somarDias('2026-11-28', 5)).toBe('2026-12-03');
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('valida datas de verdade', () => {
    expect(ehDataISO('2026-11-07')).toBe(true);
    expect(ehDataISO('2026-02-30')).toBe(false);
    expect(ehDataISO('07/11/2026')).toBe(false);
    expect(ehDataISO(20261107)).toBe(false);
  });

  it('compara horário de corte', () => {
    expect(antesDoHorario('13:59', '14:00')).toBe(true);
    expect(antesDoHorario('14:00', '14:00')).toBe(false);
    expect(antesDoHorario('09:05', '14:00')).toBe(true);
  });

  it('escreve datas de um jeito amigável', () => {
    expect(dataAmigavel('2026-11-07', '2026-11-07')).toBe('Hoje');
    expect(dataAmigavel('2026-11-08', '2026-11-07')).toBe('Amanhã');
    expect(dataAmigavel('2026-11-14', '2026-11-07')).toBe('sábado, 14 nov');
  });
});

describe('dinheiro em centavos', () => {
  it('formata em reais', () => {
    expect(formatarReais(450)).toBe('R$ 4,50');
    expect(formatarReais(14000)).toBe('R$ 140,00');
    expect(formatarReais(123456)).toBe('R$ 1.234,56');
  });

  it('lê o que a pessoa digita', () => {
    expect(lerReais('4,50')).toBe(450);
    expect(lerReais('4.50')).toBe(450);
    expect(lerReais('R$ 4,5')).toBe(450);
    expect(lerReais('4')).toBe(400);
    expect(lerReais('1.234,56')).toBe(123456);
    expect(lerReais('1.234')).toBe(123400);
    expect(lerReais('0,05')).toBe(5);
  });

  it('recusa o que não é valor', () => {
    expect(lerReais('')).toBeNull();
    expect(lerReais('abc')).toBeNull();
    expect(lerReais('4,555')).toBeNull();
    expect(lerReais('-4')).toBeNull();
  });
});

describe('WhatsApp', () => {
  it('normaliza vários formatos', () => {
    expect(normalizarWhatsapp('(53) 99999-8888')).toBe('53999998888');
    expect(normalizarWhatsapp('+55 53 99999 8888')).toBe('53999998888');
    expect(normalizarWhatsapp('5553999998888')).toBe('53999998888');
  });

  it('valida celular com DDD', () => {
    expect(whatsappValido('(53) 99999-8888')).toBe(true);
    expect(whatsappValido('53 3222-1111')).toBe(false); // fixo
    expect(whatsappValido('99999-8888')).toBe(false); // sem DDD
    expect(whatsappValido('(05) 99999-8888')).toBe(false); // DDD inválido
  });

  it('formata e monta o link', () => {
    expect(formatarWhatsapp('53999998888')).toBe('(53) 99999-8888');
    expect(linkWhatsapp('53999998888', 'Oi! Pedido 27')).toBe('https://wa.me/5553999998888?text=Oi!%20Pedido%2027');
  });
});
