export default function decorate(block) {
  [...block.querySelectorAll('a.button')].forEach((button) => {
    button.classList.remove('button');
  });
}
