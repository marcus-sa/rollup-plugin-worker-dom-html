import React from 'react';
import ReactDOM from 'react-dom';

// @TODO: Create an issue on why it has to wait for next tick
setTimeout(() => {
	const dest = document.createElement('div');
	document.body.appendChild(dest);
	ReactDOM.render(<div>Hello!</div>, dest);
});
