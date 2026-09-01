// src/App.jsx
import React, { useState, useEffect } from 'react';
import { SolidityflowdiamondContainer } from './components/SolidityflowdiamondContainer';
import './App.css';

function App() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        // Simulated data fetching
        setTimeout(() => {
            setData({
                title: 'SolidityFlowDiamond',
                description: 'A powerful React application'
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="App loading">
                <div className="spinner"></div>
                <p>Loading SolidityFlowDiamond...</p>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>{data.title}</h1>
                <p>{data.description}</p>
            </header>
            <main>
                <SolidityflowdiamondContainer />
            </main>
        </div>
    );
}

export default App;
