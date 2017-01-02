

(function ($) {

    var _dataKey = 'wizardsettings';

    var _reset = function (wiz)  {
        var settings = wiz.data(_dataKey);

        // hide all the steps except the first
        wiz.find('.wizard-step').hide().first().show();
        // show all buttons
        wiz.find('button').show();
        // disable the previous button
        settings.prevButton.prop('disabled', true);

        // special handle with 1 step
        if (settings.stepCount === 1) {
            //there's only one step, switch to submit text
            settings.nextButton.html(settings.submitText);
            // hide the previous button
            settings.prevButton.hide();
        } else {
            // reset the next button text
            settings.nextButton.html(settings.nextText);
        }
        // hide the ok button
        settings.okButton.hide();
        // reset index
        settings.stepIndex = 1;
        // hide the message
        _hideMessages(wiz);
        // reset progress
        _setProgress(settings.progress, 1, settings.stepCount);
        // reset title
        settings.titleElement.html(_getTitle(wiz, settings));
    }

    var _validate = function (wiz, settings) {
                
        // see if this step has a form, call valid if that is a function
        var step = $(wiz.find('.wizard-step')[settings.stepIndex - 1]);
        var form = step.find('form');
        if (form.length) {
            if ($.isFunction(form.valid)) {
                if (form.valid() === false) {
                    return false;
                }
            }
            if ($.isFunction(form.validate)) {
                if (form.validate() === false) {
                    return false;
                }
            }
        }

        // iterate the validators looking for matches
        if (settings.validators) {
            for (var i = 0; i < settings.validators.length; i++) {
                var v = settings.validators[i];
                // if step index matches or 0 (all steps)
                if (v.step === 0 || v.step === settings.stepIndex) {
                    if ($.isFunction(v.validate)) {
                        if (v.validate.call(wiz) === false) {
                        //if (v.validate() === false) {
                            // no bueno
                            return false;
                        }
                    }
                }
            }
        }
        // if here, it passes
        return true;
    }

    var _move = function (wiz, next) {
        //debugger;
        var settings = wiz.data(_dataKey);
        
        // special handing on next
        if (next === true) {

            // validate the current step
            if (_validate(wiz, settings) === false) {
                return;
            }
            
            // if final step, submit
            if (settings.stepIndex === settings.stepCount) {
                if ($.isFunction(settings.onSubmit)) {
                    settings.onSubmit.call(wiz);
                } else {
                    // no submit method, just close
                    _close(wiz);
                }
                return;
            }
        }

        // calculate current index and next index
        var currIndex = settings.stepIndex;
        var nextIndex = next ? settings.stepIndex + 1 : settings.stepIndex - 1;

        // store the new index for later
        settings.stepIndex = nextIndex;

        if (nextIndex > settings.stepCount || nextIndex < 1) {
            //this should never happen
        } else {
            
            var allSteps = wiz.find('.wizard-step');
            

            // hide the current step
            $(allSteps[currIndex - 1]).hide();

            // set the title
            settings.titleElement.html(_getTitle(wiz, settings));
            
            // show the next step
            $(allSteps[nextIndex - 1]).show();

            // hide the message
            _hideMessages(wiz);

            // set the progress bar
            _setProgress(settings.progress, settings.stepIndex, settings.stepCount);

            if (nextIndex === 1) {
                //we're at the beginning
                settings.prevButton.prop('disabled', true);
                //set next to standard text
                settings.nextButton.html(settings.nextText);
            } else if (nextIndex === settings.stepCount) {
                //we're on the last step, switch to submit text
                settings.nextButton.html(settings.submitText);
                //enable previous
                settings.prevButton.prop('disabled', false);
            } else {
                settings.prevButton.prop('disabled', false);
                settings.nextButton.html(settings.nextText);
            }
        }

    }

    var _close = function (wiz) {
        var settings = wiz.data(_dataKey);
        if (settings.isModal === true) {
            wiz.modal('hide');
        }
        _reset(wiz);
        if ($.isFunction(settings.onReset)) {
            settings.onReset.call(wiz);
        }
        if ($.isFunction(settings.onClose)) {
            settings.onClose.call(wiz);
        }
        if (settings.isModal === false) {
            wiz.hide();
        }
    }

    var _submit = function (wiz) {
        var settings = wiz.data(_dataKey);
        if ($.isFunction(settings.onSubmit)) {
            settings.onSubmit.call(wiz);
        } else {
            // no submit method, just close
            _close(wiz);
        }
    }

    var _cancel = function (wiz) {
        var settings = wiz.data(_dataKey);
        var close = true;
        if ($.isFunction(settings.onCancel)) {
            if (settings.onCancel.call(wiz) === false) {
                close = false;
            }
        }
        if (close) {
            _close(wiz);
        }
    }

    var _open = function (wiz) {
        var settings = wiz.data(_dataKey);
        if (settings.isModal) {
            wiz.modal({
                backdrop: 'static',
                keyboard: settings.showCancel
            });
        } else {
            wiz.show();
        }
        if ($.isFunction(settings.onOpen)) {
            settings.onOpen.call(wiz);
        }
    }

    var _initMarkup = function (wiz, settings) {
        var html = [];
        
        if (settings.isModal) {
            html.push('<div class="modal-dialog">');
        }
        
        html.push(' <div class="modal-content', settings.isModal ? '' : ' wizard-nomodal', '">');
        html.push('     <div class="modal-header">');
        if (settings.isModal && settings.showCancel === true) {
            html.push('     <button type="button" class="close wizard-cancel-header">');
            html.push('         <span aria-hidden="true">&times;</span>');
            html.push('         <span class="sr-only">Close</span>');
            html.push('     </button>');
        }
        html.push('         <h4 class="modal-title wizard-title">', _getTitle(wiz, settings), '</h4>');
        html.push('     </div>');
        html.push('     <div class="modal-body wizard-body">');

        if (settings.showProgress) {
            html.push(_initMarkupProgress(settings));
        }

        html.push('         <div class="wizard-info alert alert-info" style="display:none"></div>');
        html.push('         <div class="wizard-success alert alert-success" style="display:none"></div>');
        html.push('         <div class="wizard-warning alert alert-warning" style="display:none"></div>');
        html.push('         <div class="wizard-error alert alert-danger" style="display:none"></div>');
        html.push('     </div>');
        html.push('     <div class="modal-footer wizard-footer">');
        html.push(_initMarkupButtons(settings));
        html.push('     </div>');
        html.push(' </div>');

        if (settings.isModal) {
            html.push('</div>');
        }
        
        return html.join('');
    }

    var _initMarkupButtons = function (settings) {
        var html = [];

        if (settings.showPrevious === true) {
            html.push('<button type="button" class="btn btn-default wizard-prev">', settings.previousText, '</button>');
        }
        html.push('<button type="button" class="btn btn-primary wizard-next">', settings.nextText, '</button>');
        if (settings.showCancel === true) {
            html.push('<button type="button" class="btn btn-default wizard-cancel">' + settings.cancelText + '</button>');
        }
        html.push('<button type="button" class="btn btn-primary wizard-ok">OK</button>');
        
        return html.join('');
    }

    var _initMarkupProgress = function (settings) {
        var html = [];

        html.push('<div class="progress">');
        html.push(' <div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="10" style="width: 0%;">Progress</div>');
        html.push('</div>');

        return html.join('');
    }

    var _getTitle = function (wiz, settings) {
        var stepIndex = settings.stepIndex ? settings.stepIndex : 1;

        var curStep = $(wiz.find('.wizard-step')[stepIndex - 1]);
        
        if (curStep.data('title')) {
            // use the step title
            return curStep.data('title');
        } else {
            // use the default title
            return settings.title;
        }
    }

    var _showMessage = function(wiz, type, text) {
        wiz.find('div.wizard-' + type).html(text).show();
    }
    
    var _hideMessages = function (wiz) {
        wiz.find('.alert').html('').hide();
    }

    var _end = function (wiz, settings, options) {
        // hide steps
        wiz.find('.wizard-step').hide();

        // hide progress
        wiz.find('.progress').hide();

        // hide messagges
        _hideMessages(wiz);

        // show messages
        if (options.info) _showMessage(wiz, 'info', options.info);
        if (options.warning) _showMessage(wiz, 'warning', options.warning);
        if (options.success) _showMessage(wiz, 'success', options.success);
        if (options.error) _showMessage(wiz, 'error', options.error);

        // reset title
        settings.titleElement.html(settings.title);

        // set buttons
        settings.prevButton.hide();
        settings.nextButton.hide();
        settings.cancelButton.hide();
        settings.okButton.show();

        // auto close?
        var delay = 0;
        if (options.autoClose === true) {
            delay = 2000;
        } else if (options.autoClose > 0) {
            delay = options.autoClose;
        }
        if (delay > 0) {
            window.setTimeout(function () {
                _close(wiz);
            }, delay);
        }
        
    }

    var _setProgress = function (progress, stepIndex, stepCount) {
        var percent = parseInt(stepIndex / stepCount * 100);
        progress.css('width', percent + '%');
        progress.html('Step ' + stepIndex + ' of ' + stepCount);
        progress.parent().show();
    }

    var methods = {

        init: function (options) {

            // Establish our default settings
            var settings = $.extend({
                title: '',
                validators: null,
                onSubmit: null,
                onReset: null,
                onCancel: null,
                onClose: null,
                onOpen: null,
                previousText: '<< Back',
                nextText: 'Next >>',
                submitText: 'Submit',
                cancelText: 'Cancel',
                showCancel: true,
                showPrevious: true,
                showProgress: false,
                isModal: true,
                autoOpen: false
            }, options);
            
            return this.each(function () {
                
                var $this = $(this);

                // commit html to document
                $(_initMarkup($this, settings)).appendTo($this);

                // move the dialog to the body if it is not already there
                // dialogs have issues if they aren't a child of the body
                if (!$this.parent().is('body')) {
                    $this.appendTo($('body'))
                }

                if (settings.isModal) {
                    // clean up the modal
                    $this.addClass('modal');
                    $this.attr('tabindex', '-1');
                }
                
                // don't show
                $this.hide();

                // set refs for later
                settings.prevButton = $this.find('.wizard-prev');
                settings.nextButton = $this.find('.wizard-next');
                settings.cancelButton = $this.find('.wizard-cancel');
                settings.okButton = $this.find('.wizard-ok');
                settings.progress = $this.find('.progress-bar');
                settings.titleElement = $this.find('.wizard-title');

                // set uniform height
                if (settings.bodyHeight) {
                    $(this).find('.wizard-body').height(settings.bodyHeight);
                }
                //set the step count
                settings.stepCount = $this.find('.wizard-step').length;
                
                //set the progress width
                _setProgress(settings.progress, 1, settings.stepCount);

                // add handlers
                settings.prevButton.click(function () {
                    _move($(this).parents('.wizard').first(), false);
                });
                settings.nextButton.click(function () {
                    _move($(this).parents('.wizard').first(), true);
                });
                settings.cancelButton.click(function () {
                    _cancel($(this).parents('.wizard').first(), true);
                });
                settings.okButton.click(function () {
                    _close($(this).parents('.wizard').first(), true);
                });
                $this.find('.wizard-cancel-header').click(function () {
                    _cancel($(this).parents('.wizard').first());
                });
                
                if (settings.stepCount === 1) {
                    //there's only one step, switch to submit text
                    settings.nextButton.html(settings.submitText);
                    // hide previous
                    settings.prevButton.hide();
                }

                // move the steps into the new modal body
                $this.find('.wizard-step').appendTo($this.find('.wizard-body'));

                //store the settings
                $this.data(_dataKey, settings);

                // reset everything
                _reset($this);

                // auto open?
                if (settings.autoOpen === true) {
                    _open($this);
                }
                
            });

        },

        open: function () {
            return this.each(function () {
                _open($(this));
            }); 
        },

        close: function () {
            return this.each(function () {
                _close($(this));
            });
        },

        submit: function () {
            return this.each(function () {
                _submit($(this));
            });
        },

        info: function (text) {
            return this.each(function () {
                _showMessage($(this), 'info', text);
            });
        },

        warning: function (text) {
            return this.each(function () {
                _showMessage($(this), 'warning', text);
            });
        },

        success: function (text) {
            return this.each(function () {
                _showMessage($(this), 'success', text);
            });
        },

        error: function (text) {
            return this.each(function () {
                _showMessage($(this), 'error', text);
            });
        },

        end: function (options) {
            
            // Establish our default settings
            var options2 = $.extend({
                info: null,
                warning: null,
                success: null,
                error: null,
                autoClose: false
            }, options);

            return this.each(function () {
                _end($(this), $(this).data(_dataKey), options2);
            });
        }
    };

    $.fn.wizard = function (methodOrOptions) {
        
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.tooltip');
        }       
    }

    
}(jQuery));
