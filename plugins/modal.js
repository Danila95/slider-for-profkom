//создадим prototype фун. которая которая вставляет html footer после .modal-body
Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
};

function noop() {} //пустая фун, если фун. handler() не будет задана

function _createModalFooter(buttons = []) {
    if (buttons.length === 0){
        return document.createElement('div');
    }
    const wrap = document.createElement('div');
    wrap.classList.add('modal-footer');

    buttons.map(btn => {
        const $btn = document.createElement('button');
        $btn.textContent = btn.text;
        $btn.classList.add('btn');
        $btn.classList.add(`btn-${btn.type || 'secondary'}`);
        $btn.onclick = btn.handler || noop;

        wrap.appendChild($btn);
    });
    return wrap
}

function _createModal(options) {
    const DEFAULT_WIDTH = '600px';
    const modal = document.createElement('div');
    modal.classList.add('win-modal');
    modal.insertAdjacentHTML('afterbegin', `
        <div class="modal-overlay" data-close="">
            <div class="modal-window" style="width: ${options.width || DEFAULT_WIDTH}">
                <!--если нет двух параметров title и closable убираем div.modal-header-->
                ${!options.title && !options.closable ? '' : '<div class="modal-header">'}
                    <span class="modal-title">
                        ${options.title || ''}
                    </span>
                    ${options.closable ? `<span class="modal-close" data-close="true"></span>` : ''}
                ${!options.title && !options.closable ? '' : '</div>'}
                <div class="modal-body" data-content>
                    ${options.content || ''}
                </div>
            </div>
        </div>
    `)
    const footer =_createModalFooter(options.footerButtons);
    footer.appendAfter(modal.querySelector('[data-content]'));
    document.body.appendChild(modal);
    return modal
}

const winModal = function(options) {
    const ANIMATION_SPEED = 200;
    const $modal = _createModal(options);
    let closing = false; // предохранитель от случайного вызова фун. open(), в то время, как фун. close() будет работать
    let destroyed = false;

    const modal = { // объект в котором хранятся все методы
        open() { // Запускается из консоли modal.open()
            // фиксит баг появления на секунду модального окна (добавляет атрибут data-close="true" в .modal-overlay)
            if (!destroyed){ // проверяем была ли удалена прослушка на close(), чтобы потом не возникала ошибка в консоли
                const attr = document.querySelector('.modal-overlay');
                attr.setAttribute('data-close', true);
            }
            // ----
            if (destroyed) {
                return console.log('Modal is destroyed');
            }
            !closing && $modal.classList.add('open');
        },
        close() { // Запускается из консоли modal.close()
            // фиксит баг появления на секунду модального окна (удаляет атрибут data-close="true" из .modal-overlay)
            if (!destroyed){ // проверяем была ли удалена прослушка на закрытие, чтобы потом не возникала ошибка в консоли
                const attr = document.querySelector('.modal-overlay');
                attr.removeAttribute('data-close');
            }
            // ----
            if (destroyed) {
                return console.log('Modal is destroyed');
            }
            closing = true;
            $modal.classList.remove('open');
            $modal.classList.add('hide-win');
            setTimeout(() => {
                $modal.classList.remove('hide-win');
                closing = false;
            }, ANIMATION_SPEED);
        },
    };

    const listener = e => {
        if (e.target.dataset.close){
            modal.close();
        }
    };

    window.onkeydown = function(event) { // при нажатии на клавишу Escape закрывает модальное окно
        const attr = document.querySelector('.modal-overlay');
        if (event.key === 'Escape' && attr.dataset.close) {
            modal.close();
        }
    };
    $modal.addEventListener('click', listener); //прослушка для кнопки "крестик", которая вызывает метод close()
    // метод Object.assign() расширяет объект modal новым методом destroy(). Это сделано для того, чтобы этот метод был public
    return Object.assign(modal, {
        destroy() { // Запускается из консоли modal.destroy()
            $modal.parentNode.removeChild($modal);
            $modal.removeEventListener('click', listener);
            destroyed = true;
        },
        resizeHeightImg(target) { // функция уменьшает изображения по высоте,у которых высота больше 1000px
            const naturalHeight = target.naturalHeight;
            let htmlTeg = target.outerHTML; // получаем тег картинки
            if (naturalHeight >= 1000) {
                htmlTeg = htmlTeg.replace(/>/, ' ');
                htmlTeg += `style="height: ${options.heightBigImg};">`;
                return htmlTeg;
            }
            return htmlTeg;
        },
        isTitlePic(target,html){ // функция объединяет теги картинки и надписи для отображения в модальном окне
            let htmlTeg = html; // получаем тег картинки
            if (options.titlePic) {
                let span = target.nextSibling;
                // span.classList.add('title-pic_visible'); // проблема! Добавляет класс .title-pic_visible
                // в оригинал и копию тег пришлось тег превратить в строку и добавить класс, как строку
                let spanTeg = span.outerHTML; // получаем тег надписи
                let lastIndexOfSlash = spanTeg.lastIndexOf("\"");
                let spanTegPart1 = spanTeg.slice(0,lastIndexOfSlash);
                let spanTegPart2 = spanTeg.slice(lastIndexOfSlash);
                spanTegPart1 += ' title-pic_visible';
                spanTeg = spanTegPart1 + spanTegPart2;
                htmlTeg += spanTeg; // объединяем теги картинки и надписи
                return htmlTeg
            }
            return htmlTeg
        },
        // публичный метод, который позволяет добавляет content в виде html тегов. Запускается из консоли modal.setContent()
        setContent(html) {
            $modal.querySelector('[data-content]').innerHTML = html;
        }
    })
};
//код для стилизации плагина modal.js к слайдеру sliderCarousel.js
const sliderHorItem = document.querySelector('.slider-images');

sliderHorItem.addEventListener('click', (e) => {
    const target = e.target; // где именно был клик
    let html = '';
    if ((target.className === 'title-img title-img_visible') || (target.className === 'title-img title-pic_visible') ||
        (target.className === 'title-img title-img_visible title-pic_visible')) { // если нажали на подпись к картинке
        const target = e.target.previousSibling;
        html = modal.resizeHeightImg(target); // обрабатываем картинку
        html = modal.isTitlePic(target,html);
    } else if ((target.className === 'slider-hor-item glo-slider__item')) { // если нажали на контейнер слайда,
        const target = e.target.children[0];
        html = modal.resizeHeightImg(target);
        html = modal.isTitlePic(target,html);
    } else
        return -1;
    modal.setContent(html);
    modal.open();

});