$(document).ready(function() {
    $.getJSON('js/messages.json', function(obj) {
        $messages = obj[document.documentElement.lang];
        $table = $('#main').DataTable({
            'columns': [
                { 'data': 'title' },
                { 'data': 'title_ruby' },
                { 'data': 'volume' },
                { 'data': 'authors' },
                { 'data': 'isbn' },
                { 'data': 'jpno' },
                { 'data': 'published_date' },
                { 'data': 'ndl_url' },
            ],
            'columnDefs': [
                { 'visible': false, 'targets': 1 },
                { 'visible': false, 'targets': 5 },
                { 'visible': false, 'targets': 7 },
            ],
            'order': [[ 0, 'asc' ], [ 6, 'asc' ]],
            'lengthMenu': [ 10, 20, 30, 50, 100, 200 ],
            'displayLength': 100,
            'scrollY': true,
            'deferRender': true,
            'ajax': 'list',
            'rowCallback': function(row, data, index) {
                $('td:eq(0)', row).html('<a href="' + data.ndl_url + '" title="' + $messages.rowsAlt + '">' + data.title + '</a>');
            },
            'drawCallback': function(settings) {
                $('.pagination').append('<li class="paginate_button disabled" id="main_delete"><a href="#" id="delete" aria-controls="main" onclick="return false;">' + $messages.delete.label + '</a></li>');
            },
        });

        if (typeof customFunc == 'function') customFunc();
    });

    $.notifyDefaults({
        'placement': {
            'from': 'bottom',
            'align': 'right',
        },
        'mouse_over': 'pause',
    });

    $('#main tbody').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            $('#main_delete').addClass('disabled');
            $('#delete').attr('onclick', 'return false;');
        } else {
            $table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');

            if ($table.row('.selected').data() != null) {
                $('#main_delete').removeClass('disabled');
                $('#delete').attr('onclick', 'deleteBook(); return false;');
            }
        }
    });

    $('#register').on('submit', function(event) {
        event.preventDefault();

        var $form = $(this);
        $.ajax({
            'url': $form.attr('action'),
            'type': $form.attr('method'),
            'data': $form.serialize(),
            'success': function(result) {
                $.notify($messages.add.success, { 'type': 'success' });
                $table.ajax.reload(null, false);
                $form[0].reset();
            },
            'error': function(result) {
                var f = {
                    404: function() { $.notify($messages.not_exist, { 'type': 'warning' }); },
                    409: function() { $.notify($messages.add.failure, { 'type': 'danger' }); },
                    422: function() { validateError(result.responseJSON.code[0]); },
                };
                f[result.status]();
            },
        });
    });
});

function jumpZXingUrl() {
    var url = location.origin + '/create?code={CODE}&_token=' + document.head.querySelector('meta[name="csrf-token"]').content;
    location.href = 'http://zxing.appspot.com/scan?ret=' + escape(url);
}

function deleteBook() {
    if (window.confirm($messages.confirm)) {
        var bookId = $table.row('.selected').data().id;

        $.ajax({
            'url': 'delete',
            'type': 'POST',
            'data': {
                'id': bookId,
                '_token': document.head.querySelector('meta[name="csrf-token"]').content,
            },
            'success': function(result) {
                $table.row('.selected').remove().draw(false);
                $.notify($messages.delete.success, { 'type': 'success' });
            },
            'error': function(result) {
                var f = {
                    404: function() { $.notify($messages.delete.failure, { 'type': 'danger' }); },
                    422: function() { validateError(result.responseJSON.id[0]); },
                };
                f[result.status]();
            },
        });
    }
}

function validateError(message) {
    var $mes = $messages;
    $mes.invalid.message = '<p>' + message + '</p>';
    $.notify($mes.invalid, { 'type': 'warning' });
}
