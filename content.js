$(document).ready(function () {
    ready();
});

function setZIndex() {
    setTimeout(function () {
        try {
            $('#detail').css('z-index', 100);
            var layouts = document.getElementsByClassName('layout');
            for (let i = 0; i < layouts.length; i++) {
                layouts[i].style.zIndex = 100;
            }
            $('#J_TabBarWrap').css('z-index', 100);
        } catch (e) {
            setZIndex();
        }
    }, 1000);
}

function ready() {
    const appendage = document.createElement("div");
    appendage.className = "_appendage";
    appendage.style = "display: block;";
    document.body.insertBefore(appendage, document.body.childNodes[0]);
    const url = window.location.href;
    if (url.match(/user.dathangviettrung.site\//)) {
        chrome.storage.sync.set({ 'sid': localStorage.getItem('sid'), 'uid': localStorage.getItem('uid') }, function () {
            console.log(localStorage.getItem('uid'), localStorage.getItem('sid'));
        });
    }
    if (!(match("taobao") || match("tmall"))) return;
    chrome.runtime.sendMessage({
        action: "getAppendage",
        callback: "afterGetAppendage"
    });
    if (match("taobao")) {
        setZIndex();
        item_taobao_loaded();
    } else if (match("tmall")) {
        detail_tmall_loaded();
    }
}

function loadAppendage() {
    const req = new XMLHttpRequest();
    req.onreadystatechange = function (evt) {
        if (req.readyState === 4 && req.status === 200) {
            if (req.responseText === null) return;
            document.getElementsByClassName("_appendage")[0].innerHTML = req.responseText;
            loadScript();
        }
    };
    req.open("GET", chrome.runtime.getURL("template/index.html"), true);
    req.setRequestHeader("Content-type", "text/html");
    req.send();
}

function loadScript() {
    var tool = getToolGetter();


    var map = {};

    $(document).on("click", ".btn_add_to_cart", function () {
        if (match("taobao") || match("tmall")) {
            if (!tool.isFull()) {
                Swal.fire({
                    icon: 'error',
                    title: 'L???i',
                    text: 'Qu?? kh??ch vui l??ng ch???n ?????y ????? thu???c t??nh c???a s???n ph???m',
                    customClass: 'notranslate'
                });
                return
            }
        }

        if (document.getElementsByTagName('html')[0].getAttribute('lang') === 'vi'
            || $(".translated-ltr")[0]
        ) {
            Swal.fire({
                icon: 'error',
                title: 'L???i',
                text: 'vui l??ng t???t google d???ch tr?????c khi ?????t h??ng',
                customClass: 'notranslate'
            });
            return
        }
        chrome.storage.sync.get(['sid', 'uid'], function (result) {
            const uid = result.uid;
            // const sid = result.sid;
            if (uid === null) {
                Swal.fire({
                    icon: 'error',
                    title: 'L???i',
                    text: 'B???n ch??a ????ng nh???p vui l??ng ????ng nh???p tr?????c',
                    // confirmButtonText: '????ng nh???p'
                }).then(function () {
                    // var win = window.open(host + "/login", '_blank');
                    // win.focus();
                });
                return
            }

            const data = tool.getData();
            if (data['properties_id'] === 'undefined') {
                alert("xin vui l??ng ch???n m??u c???a s???n ph???m");
                return
            }

            map[data['properties_id']] = data;

            let time = 0;
            order_count = Object.keys(map).length;

            if (order_count === 0) {
                alert("xin vui l??ng ch???n s???n ph???m c???n mua");
                return;
            }

            Object.keys(map).forEach(function (key, index) {
                if (index == Object.keys(map).length - 1) {
                    let xhr = new XMLHttpRequest();
                    xhr.open("POST", host + "/api/create-cart", true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.setRequestHeader('Authorization', 'Bearer ' + uid);
                    xhr.send(JSON.stringify({
                        data: JSON.stringify(map[key])
                    }));
                    // console.log(JSON.stringify(map[key]))
                    xhr.onreadystatechange = function (oEvent) {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Th??ng b??o',
                                    text: '?????t h??ng th??nh c??ng',
                                    footer: '<a href="https://user.dathangviettrung.site/cart">M??? gi??? h??ng</a>',
                                    customClass: 'notranslate'
                                });
                            } else {
                                try {
                                    let res = JSON.parse(xhr.responseText);
                                    let message = "L???i";
                                    if (typeof res.message != "undefined") {
                                        message = res.message;
                                    }
                                    Swal.fire({
                                        icon: "error",
                                        title: 'L???i!',
                                        text: message,
                                    });
                                } catch (e) {
                                    Swal.fire({
                                        icon: "error",
                                        title: 'L???i!',
                                        text: "L???i...",
                                    });
                                }
                            }
                        }
                    };
                }
            });
        });
    });
}

var order_count = 0;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "afterGetAppendage") {
        loadAppendage();
    }
    else if (request.action === "afterCreateCart") {

    } else if (request.action === "orderSuccess") {
        order_count = order_count - 1 <= 0 ? 0 : order_count - 1;
        if (order_count === 0) {
            Swal.fire({
                icon: 'success',
                title: 'Th??ng b??o',
                text: '?????t h??ng th??nh c??ng',
                footer: '<a href="https://datn.order-taobao.com/">m??? gi??? h??ng</a>',
                customClass: 'notranslate'
            });
        }

    } else if (request.action === "orderError") {
        if (request.message === 'ch??a ????ng nh???p vui l??ng ????ng nh???p') {
            Swal.fire({
                icon: 'error',
                title: 'L???i',
                text: request.message,
                confirmButtonText: '????ng nh???p',
                customClass: 'notranslate'
            }).then(function () {
                var win = window.open(host + "/login", '_blank');
                win.focus();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'L???i',
                text: request.message,
                customClass: 'notranslate'
            })
        }
    } else if (request.action === "loginBeforeOrdering") {
        Swal.fire({
            icon: 'warning',
            title: 'C???nh b??o',
            text: "Vui l??ng ????ng nh???p tr?????c khi ?????t h??ng!",
            customClass: 'notranslate'
        });
    }
});
