// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SolidityFlowDiamond title', () => {
    render(<App />);
    const titleElement = screen.getByText(/SolidityFlowDiamond/i);
    expect(titleElement).toBeInTheDocument();
});
