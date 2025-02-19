import React from 'react';

const Button = () => {
  return (
    <button
      onClick={()=> console.log('hola mundo')}
      className={`py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none prueba`}
    >
      prueba
    </button>
  );
};

export default Button;
