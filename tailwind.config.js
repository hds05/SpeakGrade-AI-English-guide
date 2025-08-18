module.exports = {
    theme: {
      extend: {
        animation: {
          backgroundPulse: 'pulseBG 2s ease-in-out infinite',
        },
        keyframes: {
          pulseBG: {
            '0%, 100%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
          },
        },
      },
    },
  };
  