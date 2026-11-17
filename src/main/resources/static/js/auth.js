document.addEventListener('DOMContentLoaded', () => {
    // ================= ЭЛЕМЕНТЫ =================
    const registerTab = document.getElementById('registerTab');
    const loginTab = document.getElementById('loginTab');
    const heading = document.getElementById('heading');
    const subtitle = document.getElementById('subtitle');
    const nameField = document.getElementById('nameField');
    const confirmField = document.getElementById('confirmField');
    const agreeRow = document.getElementById('agreeRow');
    const rememberRow = document.getElementById('rememberRow');
    const forgotBlock = document.getElementById('forgotBlock');
    const submitButton = document.getElementById('submitButton');
    const switchLink = document.getElementById('switchLink');

    const form = document.getElementById('authForm');
    const inputEmail = form.querySelector('input[name="email"]');
    const inputPassword = document.getElementById('password');
    const inputConfirm = document.getElementById('confirmPassword');
    const inputName = form.querySelector('input[name="name"]');
    const inputAgreement = document.getElementById('agree');
    const messageBox = document.getElementById('message');

    let mode = 'register';
    let stage = 'idle';

    // ================= УВЕДОМЛЕНИЯ =================
    function showMessage(text, isError = false) {
        messageBox.textContent = text;
        if (isError) {
            messageBox.style.background = '#FFF0EF';
            messageBox.style.color = '#EF746D';
        } else {
            messageBox.style.background = 'var(--panel)';
            messageBox.style.color = 'var(--text)';
        }
        messageBox.classList.add('show');
    }

    function hideMessage() {
        messageBox.classList.remove('show');
    }

    // ================= ВАЛИДАЦИЯ =================
    function validateEmail() {
        const val = inputEmail.value.trim();
        const isValid = /^[a-zA-Z0-9._%+-]+@tpu\.ru$/.test(val);
        inputEmail.style.borderColor = (val.length > 0 && !isValid) ? '#EF746D' : 'var(--border)';
        return isValid || val.length === 0;
    }

    function validatePassword() {
        const val = inputPassword.value;
        const isValid = val.length >= 8;
        inputPassword.style.borderColor = (val.length > 0 && !isValid) ? '#EF746D' : 'var(--border)';
        return isValid || val.length === 0;
    }

    function validateConfirm() {
        const pass = inputPassword.value;
        const confirm = inputConfirm.value;
        const isValid = confirm === pass && confirm.length > 0;
        inputConfirm.style.borderColor = (confirm.length > 0 && !isValid) ? '#EF746D' : 'var(--border)';
        return isValid || confirm.length === 0;
    }

    inputEmail.addEventListener('input', validateEmail);
    inputPassword.addEventListener('input', () => { validatePassword(); validateConfirm(); });
    inputConfirm.addEventListener('input', validateConfirm);

    // ================= ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ =================
    function setMode(nextMode) {
        mode = nextMode;
        stage = 'idle';
        const isRegister = mode === 'register';

        registerTab.classList.toggle('active', isRegister);
        loginTab.classList.toggle('active', !isRegister);
        registerTab.setAttribute('aria-selected', String(isRegister));
        loginTab.setAttribute('aria-selected', String(!isRegister));

        heading.textContent = isRegister ? 'Создай аккаунт' : 'С возвращением';
        subtitle.textContent = isRegister ? 'На первый учебный план — через почту ТПУ.' : 'Твой следующий шаг уже ждёт тебя.';

        nameField.hidden = !isRegister;
        confirmField.hidden = !isRegister;
        agreeRow.hidden = !isRegister;
        inputAgreement.required = isRegister;
        inputConfirm.required = isRegister;

        inputPassword.autocomplete = isRegister ? 'new-password' : 'current-password';
        inputConfirm.autocomplete = 'new-password';
        rememberRow.hidden = isRegister;
        forgotBlock.hidden = isRegister;

        submitButton.textContent = isRegister ? 'Создать аккаунт' : 'Войти';
        switchLink.textContent = isRegister ? 'Уже есть аккаунт? Войти →' : 'Нет аккаунта? Зарегистрироваться →';

        hideMessage();
        inputEmail.style.borderColor = 'var(--border)';
        inputPassword.style.borderColor = 'var(--border)';
        inputConfirm.style.borderColor = 'var(--border)';
        inputEmail.readOnly = false;

        const codeBlock = document.getElementById('codeBlock');
        if (codeBlock) codeBlock.remove();
        inputPassword.parentElement.parentElement.style.display = '';
    }

    registerTab.addEventListener('click', () => setMode('register'));
    loginTab.addEventListener('click', () => setMode('login'));
    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        setMode(mode === 'register' ? 'login' : 'register');
    });

    document.querySelectorAll('.show-pass').forEach(button => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.target);
            const visible = input.type === 'password';
            input.type = visible ? 'text' : 'password';
            button.textContent = visible ? 'Скрыть' : 'Показать';
        });
    });

    // ================= ДИНАМИЧЕСКОЕ ПОЛЕ ДЛЯ КОДА =================
    function showCodeStage(email) {
        stage = 'awaiting-code';
        showMessage(`Код отправлен на ${email}. Проверьте папку «Спам», если письма нет.`);

        heading.textContent = 'Подтверждение почты';
        subtitle.textContent = 'Введите 5-значный код из письма';
        submitButton.textContent = 'Подтвердить';

        nameField.hidden = true;
        confirmField.hidden = true;
        agreeRow.hidden = true;
        inputName.required = false;
        inputConfirm.required = false;
        inputAgreement.required = false;

        inputEmail.readOnly = true;
        inputPassword.parentElement.parentElement.style.display = 'none';

        if (!document.getElementById('codeBlock')) {
            const codeBlock = document.createElement('div');
            codeBlock.id = 'codeBlock';
            codeBlock.className = 'field';
            codeBlock.innerHTML = `
                <span>Код подтверждения</span>
                <input type="text" id="code" placeholder="12345" maxlength="5" pattern="\\d{5}" inputmode="numeric" required style="text-align:center; font-size:20px; letter-spacing:4px;">
            `;
            form.insertBefore(codeBlock, submitButton);
            document.getElementById('code').focus();
        }
    }

    // ================= ОТПРАВКА ФОРМЫ =================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        if (stage === 'awaiting-code') {
            const code = document.getElementById('code').value.trim();
            if (!/^\d{5}$/.test(code)) {
                showMessage('Введи 5-значный код из письма.', true);
                return;
            }

            submitButton.textContent = 'Проверяем...';
            submitButton.disabled = true;

            try {
                const name = inputName.value.trim();
                const password = inputPassword.value;
                const email = inputEmail.value.trim();

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, code })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    if (!data.token) {
                        showMessage('Ошибка сервера: не получен токен.', true);
                        submitButton.textContent = 'Подтвердить';
                        submitButton.disabled = false;
                        return;
                    }
                    showMessage('Аккаунт успешно создан! Перенаправляем...');
                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('userName', data.name || name);

                    setTimeout(() => window.location.href = '/dashboard', 1000);
                } else {
                    showMessage(data.error || 'Ошибка регистрации', true);
                    submitButton.textContent = 'Подтвердить';
                    submitButton.disabled = false;
                }
            } catch (err) {
                showMessage('Не удалось связаться с сервером.', true);
                submitButton.textContent = 'Подтвердить';
                submitButton.disabled = false;
            }
            return;
        }

        if (mode === 'login') {
            if (!inputEmail.value || !inputPassword.value) {
                showMessage('Введи почту и пароль.', true);
                return;
            }
            if (!validateEmail()) {
                showMessage('Допустима только корпоративная почта @tpu.ru', true);
                return;
            }

            submitButton.textContent = 'Входим...';
            submitButton.disabled = true;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: inputEmail.value.trim(),
                        password: inputPassword.value
                    })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    if (!data.token) {
                        showMessage('Ошибка сервера: не получен токен.', true);
                        submitButton.textContent = 'Войти';
                        submitButton.disabled = false;
                        return;
                    }
                    showMessage('Успешный вход! Перенаправляем...');
                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('userName', data.name || inputEmail.value.split('@')[0]);

                    setTimeout(() => window.location.href = '/dashboard', 1000);
                } else {
                    showMessage(data.error || 'Ошибка входа', true);
                    submitButton.textContent = 'Войти';
                    submitButton.disabled = false;
                }
            } catch (err) {
                showMessage('Не удалось связаться с сервером.', true);
                submitButton.textContent = 'Войти';
                submitButton.disabled = false;
            }
            return;
        }

        const isEmailValid = validateEmail();
        const isPassValid = validatePassword();
        const isConfirmValid = validateConfirm();
        const isAgreementChecked = inputAgreement.checked;

        if (!isEmailValid || !isPassValid || !isConfirmValid || !inputEmail.value || !inputPassword.value || !inputConfirm.value) {
            showMessage('Пожалуйста, заполните все поля корректно.', true);
            return;
        }
        if (!isAgreementChecked) {
            showMessage('Необходимо согласие на обработку персональных данных.', true);
            return;
        }

        const email = inputEmail.value.trim();
        submitButton.textContent = 'Отправляем...';
        submitButton.disabled = true;

        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                showCodeStage(email);
            } else {
                showMessage(data.error || 'Неизвестная ошибка сервера', true);
            }
        } catch (err) {
            showMessage('Не удалось связаться с сервером.', true);
        } finally {
            submitButton.disabled = false;
            if (stage === 'idle') {
                submitButton.textContent = mode === 'login' ? 'Войти' : 'Создать аккаунт';
            }
        }
    });

    // ================= ВОССТАНОВЛЕНИЕ ПАРОЛЯ =================
    const recoveryModal = document.getElementById('recoveryModal');
    const recoveryRequest = document.getElementById('recoveryRequest');
    const recoveryVerify = document.getElementById('recoveryVerify');
    const recoverySuccess = document.getElementById('recoverySuccess');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const verifyIntro = document.getElementById('verifyIntro');
    const recoveryCode = document.getElementById('recoveryCode');
    const newPassword = document.getElementById('newPassword');
    const repeatNewPassword = document.getElementById('repeatNewPassword');
    const sendRecoveryCodeBtn = document.getElementById('sendRecoveryCode');
    const changePasswordBtn = document.getElementById('changePassword');

    let resetEmail = '';

    function openRecovery() {
        recoveryEmail.value = inputEmail.value.trim();
        recoveryRequest.hidden = false;
        recoveryVerify.hidden = true;
        recoverySuccess.hidden = true;
        recoveryModal.classList.add('open');
        hideMessage();
        setTimeout(() => recoveryEmail.focus(), 50);
    }

    function closeRecovery() {
        recoveryModal.classList.remove('open');
    }

    document.getElementById('resetButton').addEventListener('click', openRecovery);
    document.getElementById('closeRecovery').addEventListener('click', closeRecovery);
    document.getElementById('cancelRecovery').addEventListener('click', closeRecovery);
    document.getElementById('closeSuccess').addEventListener('click', closeRecovery);
    document.getElementById('closeVerify').addEventListener('click', closeRecovery);
    document.getElementById('cancelVerify').addEventListener('click', closeRecovery);

    recoveryModal.addEventListener('click', e => {
        if (e.target === recoveryModal) closeRecovery();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeRecovery();
    });

    // Шаг 1: Отправка кода
    sendRecoveryCodeBtn.addEventListener('click', async () => {
        const email = recoveryEmail.value.trim();
        if (!email) {
            recoveryEmail.focus();
            recoveryEmail.setCustomValidity('Введи корпоративную почту ТПУ.');
            recoveryEmail.reportValidity();
            return;
        }
        recoveryEmail.setCustomValidity('');
        if (!email.toLowerCase().endsWith('@tpu.ru')) {
            recoveryEmail.setCustomValidity('Укажи почту в домене @tpu.ru.');
            recoveryEmail.reportValidity();
            return;
        }

        sendRecoveryCodeBtn.disabled = true;
        sendRecoveryCodeBtn.textContent = 'Отправляем...';

        try {
            const res = await fetch('/api/auth/reset-password/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                resetEmail = email;
                verifyIntro.textContent = `Код отправлен на ${email}. Проверьте папку «Спам», если письма нет.`;
                recoveryRequest.hidden = true;
                recoveryVerify.hidden = false;
                recoverySuccess.hidden = true;
                recoveryCode.focus();
            } else {
                recoveryEmail.setCustomValidity(data.error || 'Не удалось отправить код.');
                recoveryEmail.reportValidity();
            }
        } catch (err) {
            recoveryEmail.setCustomValidity('Не удалось связаться с сервером.');
            recoveryEmail.reportValidity();
        } finally {
            sendRecoveryCodeBtn.disabled = false;
            sendRecoveryCodeBtn.textContent = 'Получить код';
        }
    });

    // Повторная отправка кода
    document.getElementById('resendRecoveryCode').addEventListener('click', async () => {
        if (!resetEmail) return;
        const btn = document.getElementById('resendRecoveryCode');
        btn.disabled = true;
        btn.textContent = 'Отправляем...';

        try {
            const res = await fetch('/api/auth/reset-password/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            if (res.ok) {
                btn.textContent = 'Код отправлен!';
                setTimeout(() => { btn.textContent = 'Отправить код повторно'; }, 3000);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || 'Не удалось отправить код.');
                btn.textContent = 'Отправить код повторно';
            }
        } catch (err) {
            alert('Не удалось связаться с сервером.');
            btn.textContent = 'Отправить код повторно';
        } finally {
            btn.disabled = false;
        }
    });

    // Шаг 2: Смена пароля
    changePasswordBtn.addEventListener('click', async () => {
        const code = recoveryCode.value.trim();
        const newPass = newPassword.value;
        const repeatPass = repeatNewPassword.value;

        [recoveryCode, newPassword, repeatNewPassword].forEach(input => input.setCustomValidity(''));

        if (!/^\d{5}$/.test(code)) {
            recoveryCode.setCustomValidity('Введи 5-значный код из письма.');
            recoveryCode.reportValidity();
            return;
        }
        if (newPass.length < 8) {
            newPassword.setCustomValidity('Пароль должен содержать не менее 8 символов.');
            newPassword.reportValidity();
            return;
        }
        if (newPass !== repeatPass) {
            repeatNewPassword.setCustomValidity('Пароли не совпадают.');
            repeatNewPassword.reportValidity();
            return;
        }

        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = 'Сохраняем...';

        try {
            const res = await fetch('/api/auth/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, code, newPassword: newPass })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                recoveryVerify.hidden = true;
                recoverySuccess.hidden = false;
            } else {
                recoveryCode.setCustomValidity(data.error || 'Не удалось изменить пароль.');
                recoveryCode.reportValidity();
            }
        } catch (err) {
            recoveryCode.setCustomValidity('Не удалось связаться с сервером.');
            recoveryCode.reportValidity();
        } finally {
            changePasswordBtn.disabled = false;
            changePasswordBtn.textContent = 'Изменить пароль';
        }
    });

    document.getElementById('backToLogin').addEventListener('click', () => {
        closeRecovery();
        setMode('login');
        document.querySelector('input[name="email"]').value = resetEmail;
        password.focus();
    });

    // ================= СНЯТИЕ ПРЕЛОАДЕРА =================
    requestAnimationFrame(() => {
        document.body.classList.remove('preload');
    });
});