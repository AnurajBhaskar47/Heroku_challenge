import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Strict mode wrapper for development
const AppWrapper = () => {
    if (process.env.NODE_ENV === 'development') {
        return (
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
    return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(<AppWrapper />)
