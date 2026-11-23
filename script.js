(() => {
  'use strict';

  const DIVIDE_BY_ZERO = 'Não é possível dividir por zero';
  const MAX_DIGITS = 14;
  const SMALL_FONT_AFTER = 10;

  const ui = {
    display: document.getElementById('display'),
    expression: document.getElementById('expression'),
    keypad: document.getElementById('calculator-buttons'),
    themeToggle: document.getElementById('theme-toggle'),
  };

  const operations = {
    '+': (a, b) => a + b,
    '−': (a, b) => a - b,
    '×': (a, b) => a * b,
    '÷': (a, b) => (b === 0 ? null : a / b),
  };

  const state = {
    current: '0',
    stored: null,
    operator: null,
    waiting: false,
    error: false,
  };

  const toNumber = (text) => Number(text.replace(',', '.'));

  const format = (value) => {
    if (!Number.isFinite(value)) return 'Erro';
    return String(Number.parseFloat(value.toPrecision(12))).replace('.', ',');
  };

  const calculate = (left, right, operator) => {
    const operation = operations[operator];
    return operation ? operation(left, right) : right;
  };

  function updateDisplay() {
    ui.display.textContent = state.current;
    ui.display.classList.toggle('small', state.current.length > SMALL_FONT_AFTER);
  }

  function highlightOperator(active) {
    ui.keypad.querySelectorAll('[data-operator]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.operator === active);
    });
  }

  function render() {
    updateDisplay();
    const hasPending = state.stored !== null && state.operator;
    ui.expression.textContent = hasPending ? `${format(state.stored)} ${state.operator}` : '';
    highlightOperator(state.waiting ? state.operator : null);
  }

  function reset() {
    Object.assign(state, { current: '0', stored: null, operator: null, waiting: false, error: false });
    render();
  }

  function showError(message) {
    Object.assign(state, { current: message, error: true, stored: null, operator: null, waiting: true });
    render();
  }

  function inputDigit(digit) {
    if (state.error) reset();

    if (state.waiting) {
      state.current = digit;
      state.waiting = false;
    } else if (state.current === '0') {
      state.current = digit;
    } else if (state.current === '-0') {
      state.current = `-${digit}`;
    } else if (state.current.length < MAX_DIGITS) {
      state.current += digit;
    }
    render();
  }

  function inputDecimal() {
    if (state.error) reset();

    if (state.waiting) {
      state.current = '0,';
      state.waiting = false;
    } else if (!state.current.includes(',')) {
      state.current += ',';
    }
    render();
  }

  function setOperator(operator) {
    if (state.error) return;

    const input = toNumber(state.current);

    if (state.operator && !state.waiting) {
      const result = calculate(state.stored, input, state.operator);
      if (result === null) return showError(DIVIDE_BY_ZERO);
      state.stored = result;
      state.current = format(result);
    } else if (state.stored === null || !state.waiting) {
      state.stored = input;
    }

    state.operator = operator;
    state.waiting = true;
    render();
  }

  function evaluate() {
    if (state.error || state.operator === null || state.stored === null) return;

    const left = state.stored;
    const right = toNumber(state.current);
    const operator = state.operator;
    const result = calculate(left, right, operator);
    if (result === null) return showError(DIVIDE_BY_ZERO);

    ui.expression.textContent = `${format(left)} ${operator} ${format(right)} =`;
    Object.assign(state, { current: format(result), stored: null, operator: null, waiting: true });
    updateDisplay();
    highlightOperator(null);
  }

  function deleteLast() {
    if (state.error) return reset();
    if (state.waiting) return;

    const { current } = state;
    const onlyOneDigit = current.length <= 1 || (current.length === 2 && current.startsWith('-'));
    state.current = onlyOneDigit ? '0' : current.slice(0, -1);
    if (state.current === '-0') state.current = '0';
    render();
  }

  function toggleSign() {
    if (state.error) return;

    if (state.waiting) {
      state.current = '0';
      state.waiting = false;
    }
    state.current = state.current.startsWith('-') ? state.current.slice(1) : `-${state.current}`;
    render();
  }

  function applyPercent() {
    if (state.error) return;

    state.current = format(toNumber(state.current) / 100);
    state.waiting = false;
    render();
  }

  const actions = {
    clear: reset,
    decimal: inputDecimal,
    equals: evaluate,
    backspace: deleteLast,
    sign: toggleSign,
    percent: applyPercent,
  };

  ui.keypad.addEventListener('click', ({ target }) => {
    const button = target.closest('button');
    if (!button) return;

    const { number, operator, action } = button.dataset;
    if (number !== undefined) inputDigit(number);
    else if (operator) setOperator(operator);
    else if (action && actions[action]) actions[action]();
  });

  // Teclas que precisam de preventDefault para não acionar comportamento padrão do navegador
  const keyBindings = {
    '.': [inputDecimal],
    ',': [inputDecimal],
    '+': [() => setOperator('+')],
    '-': [() => setOperator('−')],
    '*': [() => setOperator('×')],
    '/': [() => setOperator('÷'), true],
    Enter: [evaluate, true],
    '=': [evaluate, true],
    Backspace: [deleteLast, true],
    Escape: [reset],
    Delete: [reset],
    '%': [applyPercent],
  };

  document.addEventListener('keydown', (event) => {
    if (/^[0-9]$/.test(event.key)) return inputDigit(event.key);

    const binding = keyBindings[event.key];
    if (!binding) return;

    const [handler, preventDefault] = binding;
    if (preventDefault) event.preventDefault();
    handler();
  });

  ui.themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    ui.themeToggle.setAttribute('aria-label', isLight ? 'Ativar tema escuro' : 'Ativar tema claro');
  });

  render();
})();
