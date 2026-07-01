import { state }         from '../store/state.js';
import { fmt }           from '../utils/format.js';
import { MONTHS_COUNT }  from '../constants.js';

function monthOffsets() {
  return Array.from({ length: MONTHS_COUNT }, (_, i) => i - (MONTHS_COUNT - 1));
}

export class EditorView {
  constructor(container, { onNavigateToDashboard } = {}) {
    this.container            = container;
    this.onNavigateToDashboard = onNavigateToDashboard ?? null;
    this._unsubscribe         = null;
    this._editingCode         = null;
  }

  mount() {
    this._render();
    this._unsubscribe = state.subscribe(() => this._renderList());
  }

  unmount() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  editProduct(code) {
    this._editingCode = code;
    this._populateForm(state.getByCode(code));
  }

  _render() {
    this.container.innerHTML = `
      <div class="editor">
        <h1 class="page-title">Atualizar estoque (PCP)</h1>

        <section class="form-card" aria-label="Formulário de cadastro de produto">
          <p class="section-title" id="form-title">Cadastrar produto</p>

          <div class="field-group">
            <label class="field-label" for="f-code">Código</label>
            <input class="field-input" id="f-code" type="text"
              placeholder="ex: PA-001" autocomplete="off" style="max-width:180px">
          </div>

          <div class="field-group">
            <label class="field-label" for="f-desc">Descrição</label>
            <input class="field-input" id="f-desc" type="text"
              placeholder="Nome do produto acabado">
          </div>

          <div class="field-group">
            <label class="field-label" for="f-stock">Estoque atual (un)</label>
            <input class="field-input" id="f-stock" type="number"
              placeholder="0" min="0" step="1" style="max-width:180px">
          </div>

          <fieldset class="months-fieldset">
            <legend class="field-label">Vendas mensais — últimos ${MONTHS_COUNT} meses</legend>
            <div class="months-grid">
              ${monthOffsets().map((offset, i) => `
                <div class="month-cell">
                  <label class="month-label" for="m${i}">${fmt.monthLabel(offset)}</label>
                  <input class="field-input" id="m${i}" type="number"
                    placeholder="0" min="0" step="1">
                </div>`).join('')}
            </div>
          </fieldset>

          <p class="field-error" id="form-error" role="alert" aria-live="polite"></p>

          <div class="form-actions">
            <button class="btn btn-outline" id="btn-clear">Limpar</button>
            <button class="btn btn-primary" id="btn-save">
              <i class="ti ti-check" aria-hidden="true"></i> Salvar produto
            </button>
          </div>
        </section>

        <section aria-label="Produtos cadastrados">
          <p class="section-title">Produtos cadastrados</p>
          <div id="product-list"></div>
          <div class="danger-zone">
            <button class="btn btn-danger-outline" id="btn-reset">
              <i class="ti ti-trash" aria-hidden="true"></i> Restaurar dados iniciais
            </button>
          </div>
        </section>
      </div>`;

    this._renderList();
    this._bindFormEvents();
  }

  _renderList() {
    const list = this.container.querySelector('#product-list');
    if (!list) return;

    const products = state.getAll();
    if (!products.length) {
      list.innerHTML = '<p class="empty-state">Nenhum produto cadastrado.</p>';
      return;
    }

    list.innerHTML = products.map(p => {
      const { label, badgeClass } = p.statusMeta;
      return `
        <div class="list-item" data-code="${p.code}">
          <div class="list-item-body">
            <span class="list-item-code">${p.code}</span>
            <span class="list-item-desc">${p.description}</span>
            <span class="list-item-meta">
              Estoque: ${fmt.integer(p.stock)} un &nbsp;·&nbsp;
              Consumo: ${fmt.integer(p.avgConsumption)} un/mês &nbsp;·&nbsp;
              Cobertura: ${fmt.coverage(p.coverage)}
            </span>
          </div>
          <div class="list-item-actions">
            <span class="badge ${badgeClass}">${label}</span>
            <button class="btn btn-icon btn-edit" data-action="edit" data-code="${p.code}"
              aria-label="Editar ${p.code}">
              <i class="ti ti-edit" aria-hidden="true"></i>
            </button>
            <button class="btn btn-icon btn-delete" data-action="delete" data-code="${p.code}"
              aria-label="Remover ${p.code}">
              <i class="ti ti-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    list.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, code } = btn.dataset;
      if (action === 'edit')   this._onEdit(code);
      if (action === 'delete') this._onDelete(code);
    }, { once: false });
  }

  _bindFormEvents() {
    this.container.querySelector('#btn-save')
      ?.addEventListener('click', () => this._onSave());
    this.container.querySelector('#btn-clear')
      ?.addEventListener('click', () => this._clearForm());
    this.container.querySelector('#btn-reset')
      ?.addEventListener('click', () => this._onReset());
  }

  _onSave() {
    const errorEl = this.container.querySelector('#form-error');
    errorEl.textContent = '';

    const code  = this.container.querySelector('#f-code').value.trim();
    const desc  = this.container.querySelector('#f-desc').value.trim();
    const stock = Number(this.container.querySelector('#f-stock').value);
    const monthlySales = Array.from({ length: MONTHS_COUNT }, (_, i) =>
      Number(this.container.querySelector(`#m${i}`).value) || 0
    );

    if (!code) { errorEl.textContent = 'Informe o código do produto.'; return; }
    if (!desc) { errorEl.textContent = 'Informe a descrição.'; return; }
    if (!Number.isFinite(stock) || stock < 0) { errorEl.textContent = 'Estoque inválido.'; return; }

    try {
      state.addOrUpdate({ code, description: desc, stock, monthlySales });
      this._clearForm();
      this.onNavigateToDashboard?.();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  _onEdit(code) {
    this._editingCode = code;
    this._populateForm(state.getByCode(code));
    this.container.querySelector('#form-title').textContent = `Editando ${code}`;
    this.container.querySelector('#f-code').disabled = true;
    this.container.querySelector('#f-code').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _onDelete(code) {
    if (!confirm(`Remover ${code}?`)) return;
    state.remove(code);
    if (this._editingCode === code) this._clearForm();
  }

  _onReset() {
    if (!confirm('Restaurar os dados de exemplo e apagar todos os produtos?')) return;
    state.reset();
    this._clearForm();
  }

  _populateForm(product) {
    if (!product) return;
    this.container.querySelector('#f-code').value  = product.code;
    this.container.querySelector('#f-desc').value  = product.description;
    this.container.querySelector('#f-stock').value = product.stock;
    product.monthlySales.forEach((v, i) => {
      const el = this.container.querySelector(`#m${i}`);
      if (el) el.value = v;
    });
  }

  _clearForm() {
    this._editingCode = null;
    ['#f-code', '#f-desc', '#f-stock'].forEach(sel =>
      (this.container.querySelector(sel).value = '')
    );
    this.container.querySelector('#f-code').disabled = false;
    Array.from({ length: MONTHS_COUNT }, (_, i) => {
      const el = this.container.querySelector(`#m${i}`);
      if (el) el.value = '';
    });
    const titleEl = this.container.querySelector('#form-title');
    if (titleEl) titleEl.textContent = 'Cadastrar produto';
    const errorEl = this.container.querySelector('#form-error');
    if (errorEl) errorEl.textContent = '';
  }
}
