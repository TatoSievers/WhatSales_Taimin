import React, { useEffect, useState } from 'react';
import { getPopupConfig } from '../utils';
import CloseIcon from './icons/CloseIcon';

const StartupPopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [text, setText] = useState('');

    useEffect(() => {
        const checkPopup = async () => {
            const config = await getPopupConfig();
            if (!config || !config.active || !config.text) return;

            if (config.expiresAt) {
                const expirationDate = new Date(config.expiresAt);
                // Set to end of the day or exact time? Plan said expiresAt so let's respect the exact time if provided, 
                // but utils usually deal with dates. Let's assume standard comparison.
                if (new Date() > expirationDate) {
                    return;
                }
            }

            // Check if already shown this session? 
            // User request didn't specify session storage, but "no carregamento da app".
            // Usually these popups show once per session or always. 
            // "No carregamento da app" implies every time the app loads (refresh).
            // Let's keep it simple: show on mount.

            setText(config.text);
            setIsVisible(true);
        };

        checkPopup();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative overflow-hidden animate-fade-in-up">
                {/* Header/Close Button */}
                <div className="absolute top-2 right-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Fechar aviso"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-primary-900 mb-4">Aviso Importante</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
                </div>

                {/* Footer/Action */}
                <div className="bg-gray-50 px-6 py-4 flex justify-center">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartupPopup;
