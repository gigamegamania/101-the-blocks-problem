import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

// Mock fetch
globalThis.fetch = vi.fn() as typeof fetch;

describe('App', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('renders the component', () => {
    const wrapper = mount(App);
    expect(wrapper.find('h1').text()).toBe('Technical Test App');
    expect(wrapper.find('textarea#textbox').exists()).toBe(true);
  });

  it('has a textarea with placeholder', () => {
    const wrapper = mount(App);
    const textarea = wrapper.find('textarea#textbox');
    expect(textarea.attributes('placeholder')).toBe('Type something...');
  });

  it('calls the backend on input change', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ solution: '0: 0\n1: 1\n2: 2\n3: 3' }),
    } as unknown as Response;
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    const wrapper = mount(App);
    const textarea = wrapper.find('textarea#textbox');

    await textarea.setValue('test input');
    await textarea.trigger('input');

    // Wait for async operations
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5170/blocks/solve',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'test input' }),
      }),
    );
  });

  it('does not call the backend when input is empty', async () => {
    const wrapper = mount(App);
    const textarea = wrapper.find('textarea#textbox');

    await textarea.setValue('');
    await textarea.trigger('input');

    await wrapper.vm.$nextTick();

    expect(fetch).not.toHaveBeenCalled();
  });
});
