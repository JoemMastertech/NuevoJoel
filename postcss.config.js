module.exports = {
  plugins: [
    require('autoprefixer')(),
    process.env.NODE_ENV === 'production'
      ? require('@fullhuman/postcss-purgecss').default({
          content: [
            './**/*.html',
            './Shared/**/*.js',
            './Aplicacion/**/*.js',
            './Interfaces/**/*.js'
          ],
          safelist: [
            // State classes
            'is-open',
            'is-collapsed',
            'active',
            'open',
            'modal-hidden',
            'screen-hidden',
            'screen-visible',
            // BEM classes we are introducing
            'order-sidebar',
            'order-sidebar__header',
            'order-sidebar__content',
            'order-sidebar__items',
            'order-sidebar--compact',
            'drink-modal',
            'drink-modal__grid',
            'drink-modal__option'
          ],
        })
      : null,
    require('cssnano')({ preset: ['default', { calc: false }] })
  ].filter(Boolean)
};