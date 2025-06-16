import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import URLInputForm from '../../components/URLInputForm';

describe('URLInputForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders input form correctly', () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    expect(screen.getByLabelText('Enter Website URL:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replicate Website' })).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={true} />);
    
    expect(screen.getByRole('button', { name: /Loading/i })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  test('validates empty input', async () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    const submitButton = screen.getByRole('button', { name: 'Replicate Website' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  test('validates URL format', async () => {
    const user = userEvent.setup();
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    await user.type(input, 'not-a-url');
    
    const submitButton = screen.getByRole('button', { name: 'Replicate Website' });
    await user.click(submitButton);
    
    expect(screen.getByRole('alert')).toHaveTextContent(/must start with http/i);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits valid URL', async () => {
    const user = userEvent.setup();
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    await user.type(input, 'https://example.com');
    
    const submitButton = screen.getByRole('button', { name: 'Replicate Website' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com');
    });
  });

  test('clears validation error when typing', async () => {
    const user = userEvent.setup();
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    await user.type(input, 'invalid');
    
    const submitButton = screen.getByRole('button', { name: 'Replicate Website' });
    await user.click(submitButton);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Type more to clear error
    await user.type(input, 'more');
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('disables input when loading', () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={true} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    expect(input).toBeDisabled();
  });

  test('enforces max length', () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    expect(input).toHaveAttribute('maxLength', '2048');
  });

  test('shows help text', () => {
    render(<URLInputForm onSubmit={mockOnSubmit} loading={false} />);
    
    expect(screen.getByText(/Enter the complete URL including/i)).toBeInTheDocument();
    expect(screen.getByText(/Examples:/i)).toBeInTheDocument();
  });
});